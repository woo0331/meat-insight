-- ════════════════════════════════════════════════════════════════════
-- 0005 — 로그인한 사람 줄 만들기 + 로그인 전에 넣은 신청 가져오기
--        (지시서 §10 고객 마이페이지)
--
-- 0001~0004 가 상태와 돈의 뼈대였습니다. 여기서 막힌 두 자리를
-- 엽니다 — 둘 다 **실제로 눌러 보려다 발견한 것**입니다.
--
--   ① 로그인해도 account 줄이 없어서 역할이 없었습니다.
--      my_role() 이 null 이면 RLS 가 전부 막아서, 가입한 사람이
--      **자기 신청조차** 못 봅니다.
--
--   ② ⚠️⚠️ **고객이 자기 배정을 못 봤습니다.** assignment 의 select
--      정책이 업체와 직원 · 관리자뿐이라, "어느 업체에 연결되었나" 가
--      신청하신 분에게 안 보였습니다. 그런데 제17조 재동의는 **상호를
--      알려 드리고** 받는 것이라, 상호를 못 보는 마이페이지는 §10 을
--      지킬 수가 없습니다. 0001 을 고치지 않고 정책을 **더합니다**
--      (돌린 파일은 고치지 않는다 — db/README.md).
-- ════════════════════════════════════════════════════════════════════

-- ── ① 가입하면 account 줄이 생깁니다 ────────────────────────────────
-- ⚠️⚠️ **역할을 'customer' 로 박아 둡니다.** 가입하는 쪽에서 역할을
-- 고를 수 있으면 누구나 관리자가 됩니다. 역할 올리기는 SQL 로만 합니다
-- (CLAUDE.md — "관리자를 화면에서 만들 수 있게 하지 마세요").
-- ⚠️ provider_id 도 여기서 채우지 않습니다. 업체와 사람을 잇는 것은
-- 서류를 보고 사람이 하는 일입니다.
create or replace function handle_new_user() returns trigger
  language plpgsql security definer set search_path = public as $$
begin
  insert into account (id, role, name)
    values (new.id, 'customer',
            nullif(trim(coalesce(new.raw_user_meta_data->>'name', '')), ''))
    on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- 이미 가입한 사람이 있으면 메꿉니다 (두 번 돌려도 안전합니다)
insert into account (id, role)
  select u.id, 'customer' from auth.users u
  where not exists (select 1 from account a where a.id = u.id);


-- ── ② 신청하신 분이 자기 배정을 봅니다 ──────────────────────────────
-- ⚠️ 돈이 없는 표입니다 (state · 동의시각 · 사유). 수수료 표는 그대로
-- 고객에게 안 보입니다 — fee_policy · deal 정책은 건드리지 않습니다.
--
-- ⚠️⚠️ **정책 안에서 request 를 바로 읽으면 무한 재귀입니다.** request 의
-- request_assigned 정책이 assignment 를 읽고, assignment 의 이 정책이
-- 다시 request 를 읽습니다 — Postgres 가
-- "infinite recursion detected in policy for relation request" 로
-- 멈춥니다. **실제로 돌려 보고 알았습니다** (0001 을 돌려 보지 않아
-- GRANT 가 빠진 것을 뒤늦게 찾은 그 자리입니다).
-- 그래서 my_role() · my_provider() 와 같은 방식으로 **security definer
-- 함수**로 끊습니다 — 함수 안의 읽기는 RLS 를 거치지 않습니다.
-- ⚠️ 이 함수는 `user_id = auth.uid()` 인 줄에만 true 를 돌려줍니다 —
-- 남의 신청에 대해서는 무엇도 알려 주지 않습니다.
create or replace function is_my_request(rid uuid) returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (select 1 from request
                  where id = rid and user_id = auth.uid())
$$;
revoke all on function is_my_request(uuid) from public;
grant execute on function is_my_request(uuid) to authenticated;

drop policy if exists assign_requester on assignment;
create policy assign_requester on assignment for select
  using (is_my_request(request_id));


-- ── ③ 로그인 전에 넣은 신청을 내 것으로 (§10) ───────────────────────
-- 접수는 로그인 없이 들어옵니다 (그게 맞습니다 — 견적 하나 받으려고
-- 가입하게 만들면 거기서 닫습니다). 그래서 request.user_id 가 비어
-- 있고, 나중에 가입하신 분이 **신청번호와 연락처로** 가져갑니다.
--
-- ⚠️⚠️ **번호만으로는 안 됩니다.** 번호 하나로 열어 주면 그 번호를
-- 손에 넣은 사람이 남의 성함 · 연락처 · 요청 내용을 다 봅니다.
-- 번호(40비트 난수)와 연락처가 **둘 다** 맞아야 합니다.
--
-- ⚠️⚠️ **틀린 까닭을 갈라서 말하지 않습니다.** "그런 번호는 없습니다" 와
-- "연락처가 다릅니다" 를 갈라 주면 번호가 있는지를 확인해 가며 긁을 수
-- 있습니다 — 한 가지 말로만 거절합니다.
create or replace function claim_request(p_no text, p_tel text)
  returns uuid
  language plpgsql security definer set search_path = public as $$
declare
  v_uid  uuid := auth.uid();
  v_no   text;
  v_tel  text;
  v_id   uuid;
begin
  if v_uid is null then
    raise exception '로그인이 필요합니다';
  end if;

  -- 번호를 씻습니다 — api/_intake.js 의 reqNoClean() 과 같은 규칙입니다
  -- (소문자 · 줄표 없음 · 띄어쓰기를 다 알아봅니다).
  v_no := upper(regexp_replace(coalesce(p_no, ''), '[^0-9A-Za-z]', '', 'g'));
  -- ⚠️ `SW` 머리까지 **그대로 있어야** 합니다. 머리를 떼고 받아 주면
  -- 몸통이 `SW…` 로 시작하는 번호와 갈릴 수가 없습니다 (몸통에도 S 와
  -- W 가 들어갑니다) — reqNoClean() 이 `SW` + 여덟 글자만 받는 까닭입니다.
  -- ⚠️ 뺀 글자(I·L·O·U)가 섞이면 받지 않습니다 — 받아 주면 0/O 를
  -- 헷갈려 적은 번호가 **남의 번호에 맞을** 수 있습니다.
  if v_no !~ '^SW[0-9A-HJKMNP-TV-Z]{8}$' then
    raise exception '신청번호와 연락처가 맞지 않습니다';
  end if;
  v_no := 'SW-' || substring(v_no from 3 for 4) || '-' || substring(v_no from 7 for 4);

  -- ⚠️ 전화번호는 **숫자만 남겨** 견줍니다 (031-000-0000 과
  -- 0310000000 은 같은 번호입니다 — /admin 영업 작업대와 같은 규칙).
  v_tel := regexp_replace(coalesce(p_tel, ''), '[^0-9]', '', 'g');
  if length(v_tel) < 9 then
    raise exception '신청번호와 연락처가 맞지 않습니다';
  end if;

  select id into v_id from request
   where no = v_no
     and regexp_replace(tel, '[^0-9]', '', 'g') = v_tel
     and (user_id is null or user_id = v_uid)
   limit 1;

  if v_id is null then
    raise exception '신청번호와 연락처가 맞지 않습니다';
  end if;

  update request set user_id = v_uid where id = v_id and user_id is null;

  -- §8 — 중요한 변경은 **누가 언제** 를 같이 적습니다. 같은
  -- 트랜잭션이라 기록이 실패하면 잇는 것도 안 됩니다.
  insert into audit_log (by_user, by_role, obj, obj_id, why)
    values (v_uid, my_role(), 'request', v_id::text, '신청번호로 내 것으로 연결');

  return v_id;
end $$;

-- ⚠️ 로그인한 사람만. anon 에게 주면 번호를 긁는 길이 열립니다.
revoke all on function claim_request(text, text) from public;
grant execute on function claim_request(text, text) to authenticated;

insert into schema_version (n, name) values (5, '0005_account_claim')
on conflict (n) do nothing;
