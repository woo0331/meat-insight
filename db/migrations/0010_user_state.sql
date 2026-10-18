-- ════════════════════════════════════════════════════════════════════
-- 0010 — 회원 계정에 남는 임시저장 · 체크리스트
--        2026-10-18 "매장 운영 전문관 2차" §6-2 · §9
--
-- ⚠️⚠️ **왜 이 파일이 생겼나 — 저장이 브라우저 안에만 있었습니다.**
--   §6-2 는 "회원이면 서버에 임시저장한다", §9 는 "로그인한 회원은
--   체크 상태를 계정에 저장한다" 였는데, 둘 다 `localStorage` 뿐이라
--   ① 폰에서 고르고 PC 에서 이으실 수가 없고 ② 가게 컴퓨터를 바꾸면
--   사라지고 ③ 사파리 비공개 모드에서는 애초에 안 남았습니다.
--
-- ⚠️⚠️ **브라우저 저장을 없앤 것이 아닙니다.** 로그인하지 않은 분이
--   여전히 더 많고(지금은 전부), 로그인이 꺼져 있는 동안 화면은
--   **오늘과 글자 하나 다르지 않게** 돕니다. 이 표는 **로그인한
--   분에게만** 한 겹 더 붙는 것이고, 어느 쪽이 이기는지는
--   `js/state.js` 머리말에 적혀 있습니다.
--
-- ⚠️⚠️ **새 표가 하나입니다** (§8 "기존 스키마가 있으면 새 테이블을
--   중복 생성하지 않는다"). 담는 것 셋이 전부 **그 사람의 메모장**이고
--   줄 수명이 같아서, 셋을 따로 두면 표 셋에 같은 열쇠를 세 번 적는
--   꼴입니다.
--
-- ⚠️⚠️ **감사 기록(audit_log)을 남기지 않습니다.** §8 의 "모든 중요한
--   상태 변경" 은 신청 · 계약 · 돈의 상태를 말합니다. 여기는 그 사람이
--   자기 메모를 고치는 일이고 자동저장이라, 기록을 남기면 체크 한 번에
--   줄 하나씩 쌓여 **정작 돈 기록이 그 더미에 묻힙니다.**
--
--     ① user_state        계정 하나에 한 줄 (고른 서비스 · 조건 · 체크)
--     ② user_state_guard  ⚠️ 담을 수 있는 칸을 **DB 가** 정합니다
--     ③ save_user_state   저장하는 유일한 길 (표에는 쓰기 권한이 없습니다)
--     ④ clear_user_state   지우는 길 — 되돌릴 수 없으므로 화면이 한 번 묻습니다
--
-- ⚠️ 두 번 돌려도 안전합니다 (if not exists · create or replace).
-- ⚠️⚠️ 돌린 파일(0001~0009)을 **고치지 않았습니다**.
-- ════════════════════════════════════════════════════════════════════

begin;

-- ════════════════════════════════════════════════════════════════════
-- ① 계정 하나에 한 줄
--
-- ⚠️⚠️ **성함 · 연락처를 담는 칸이 없습니다.** 담는 것은 §6-1 이
--   정한 조건 여덟 칸(상황 · 필요한 일 · 업종 · 지역 · 시군구 · 평수 ·
--   예산 · 일정)과 고르신 서비스 id · 체크해 두신 항목 key 까지입니다 —
--   성함과 연락처는 이미 `auth.users` 와 접수 줄에 있고, 메모장에 또
--   두면 그 순간 지우기 어려운 사본이 하나 늘어납니다 (최소 수집).
-- ⚠️ `account_id` 가 곧 기본키입니다 — 한 사람에 한 줄이라 쌓이지
--   않습니다. 계정이 지워지면 같이 지워집니다 (on delete cascade).
-- ⚠️⚠️ **값의 꼴과 개수를 여기서도 봅니다.** 문(③)이 먼저 거르지만,
--   표에 자물쇠가 없으면 나중에 다른 길이 하나 생기는 날 아무도
--   모릅니다 (이 저장소가 GRANT 와 RLS 를 **둘 다** 거는 까닭).
--   ⚠️ 칸 이름 허용 목록은 CHECK 에 못 담습니다 (하위 질의가 됩니다) —
--   그건 ② 트리거가 봅니다.
create table if not exists user_state (
  account_id  uuid primary key references account(id) on delete cascade,
  -- 고르신 서비스 id — `catalog.js` 의 분류 key 또는 `분류/하위`
  pick        jsonb not null default '[]',
  -- 적어 두신 조건 여덟 칸 (§6-1)
  draft       jsonb not null default '{}',
  -- 체크해 두신 운영 항목 key (`opscheck.js`)
  checks      jsonb not null default '[]',
  updated_at  timestamptz not null default now(),
  constraint user_state_pick_arr   check (jsonb_typeof(pick)   = 'array'),
  constraint user_state_checks_arr check (jsonb_typeof(checks) = 'array'),
  constraint user_state_draft_obj  check (jsonb_typeof(draft)  = 'object'),
  -- ⚠️ 상한이 있는 까닭 — 이 줄은 **자동저장**으로 들어옵니다. 상한이
  --    없으면 한 계정이 메가바이트짜리 jsonb 를 밀어 넣을 수 있습니다
  --    (§15 "악용 방어").
  constraint user_state_pick_cap   check (jsonb_array_length(pick)   <= 60),
  constraint user_state_checks_cap check (jsonb_array_length(checks) <= 100)
);

alter table user_state enable row level security;

-- ⚠️⚠️ **자기 줄만 읽습니다.** 직원 · 관리자에게도 열지 않았습니다 —
--   남의 메모장을 보는 것은 운영에 필요한 일이 아니고, 열어 두면
--   목록 하나가 곧 "이 사람이 무엇을 알아보고 있는가" 입니다.
drop policy if exists state_mine on user_state;
create policy state_mine on user_state for select
  using (account_id = auth.uid());

-- ⚠️⚠️ **읽기만 줍니다.** insert · update · delete 를 주면 아래 문을
--   거치지 않는 길이 하나 생기고, 그러면 ② 트리거만 남습니다 (§8).
-- ⚠️ `anon`(로그인 안 한 사람)에게는 아무 권한도 주지 않습니다.
grant select on user_state to authenticated;


-- ════════════════════════════════════════════════════════════════════
-- ② ⚠️⚠️ 담을 수 있는 칸을 **DB 가** 정합니다
--
-- 화면이 보내는 것만 담기면 될 일이지만, **화면을 믿지 않습니다** —
-- 이 저장소의 규칙 그대로입니다 (역할을 요청에서 안 읽는 것과 같은
-- 까닭). 여기서 막으면 나중에 화면 버그로 성함 · 연락처가 섞여
-- 들어와도 **표에 안 들어갑니다.**
--
-- ⚠️⚠️ **조용히 걷어내지 않고 거절합니다.** 걷어내면 그 버그를
--   아무도 모르는 채 몇 달이 갑니다. 거절하면 §15 대로 화면이
--   "저장하지 못했습니다" 를 그대로 말합니다 (성공 메시지 금지).
-- ⚠️ 거절하는 말에 **값을 싣지 않습니다** — 성함이 섞여 들어온
--   경우에 그 성함이 에러 글과 로그에 남으면 안 됩니다. 칸 이름까지만.
create or replace function user_state_guard() returns trigger
  language plpgsql as $$
declare
  k text;
  v jsonb;
begin
  -- 조건 여덟 칸 (§6-1) — 이 목록 밖은 못 담습니다
  for k in select jsonb_object_keys(new.draft) loop
    if k not in ('q-side','q-what','q-ind','q-reg','q-gu',
                 'q-py','q-bud','q-when') then
      raise exception '저장할 수 없는 칸입니다 — %', k;
    end if;
    if jsonb_typeof(new.draft->k) <> 'string' then
      raise exception '저장할 수 없는 값입니다 — %', k;
    end if;
    if length(new.draft->>k) > 120 then
      raise exception '값이 너무 깁니다 — %', k;
    end if;
  end loop;

  -- 고른 서비스 · 체크 항목은 **글자 배열**입니다
  for v in select * from jsonb_array_elements(new.pick) loop
    if jsonb_typeof(v) <> 'string' or length(v #>> '{}') > 60
       or btrim(v #>> '{}') = '' then
      raise exception '서비스 id 를 읽을 수 없습니다';
    end if;
  end loop;
  for v in select * from jsonb_array_elements(new.checks) loop
    if jsonb_typeof(v) <> 'string' or length(v #>> '{}') > 60
       or btrim(v #>> '{}') = '' then
      raise exception '체크 항목을 읽을 수 없습니다';
    end if;
  end loop;

  new.updated_at := now();
  return new;
end $$;

drop trigger if exists user_state_guard_t on user_state;
create trigger user_state_guard_t before insert or update on user_state
  for each row execute function user_state_guard();


-- ════════════════════════════════════════════════════════════════════
-- ③ 저장하는 유일한 길
--
-- ⚠️⚠️ **`auth.uid()` 에만 씁니다.** 인자로 계정을 받지 않습니다 —
--   받으면 로그인한 누구나 남의 메모장을 덮어씁니다. 이 저장소가
--   "변경자는 토큰에서만 옵니다" 로 못박아 둔 그 선입니다.
-- ⚠️ `null` 로 보낸 칸은 **그대로 둡니다** (coalesce). 화면이 셋 중
--   하나만 바뀌었을 때 나머지를 지우지 않으려고요 — 전부 보내게
--   하면 한쪽 화면의 자동저장이 다른 쪽을 쓸어 버립니다.
--   ⚠️⚠️ **비우는 것은 `[]` · `{}` 로 보냅니다** (null 과 다릅니다).
create or replace function save_user_state(
    p_pick jsonb default null, p_draft jsonb default null,
    p_checks jsonb default null)
  returns timestamptz
  language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  t   timestamptz;
begin
  if uid is null then
    raise exception '로그인이 필요합니다';
  end if;
  -- ⚠️ 계정 줄이 없으면 저장할 데가 없습니다 (가입 트리거가 만듭니다).
  --    없는데 만들어 주면 역할이 없는 유령 계정이 생깁니다.
  if not exists (select 1 from account where id = uid) then
    raise exception '계정을 찾을 수 없습니다';
  end if;

  insert into user_state (account_id, pick, draft, checks)
  values (uid, coalesce(p_pick, '[]'::jsonb),
               coalesce(p_draft, '{}'::jsonb),
               coalesce(p_checks, '[]'::jsonb))
  on conflict (account_id) do update
     set pick   = coalesce(p_pick,   user_state.pick),
         draft  = coalesce(p_draft,  user_state.draft),
         checks = coalesce(p_checks, user_state.checks)
  returning updated_at into t;
  return t;
end $$;
revoke all on function save_user_state(jsonb, jsonb, jsonb) from public;
grant execute on function save_user_state(jsonb, jsonb, jsonb) to authenticated;


-- ════════════════════════════════════════════════════════════════════
-- ④ 지우는 길
--
-- ⚠️ 이 저장소는 저장하는 자리마다 **지우는 단추를 같이** 냅니다 —
--   되돌릴 수 없으므로 화면이 한 번 묻습니다 (브라우저 저장과 같은 선).
create or replace function clear_user_state() returns void
  language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception '로그인이 필요합니다';
  end if;
  delete from user_state where account_id = uid;
end $$;
revoke all on function clear_user_state() from public;
grant execute on function clear_user_state() to authenticated;


-- 판 번호 (db/README.md) — ⚠️ 칸 이름은 0002 의 것입니다 (n · name)
insert into schema_version (n, name) values (10, '0010_user_state')
on conflict (n) do nothing;

commit;
