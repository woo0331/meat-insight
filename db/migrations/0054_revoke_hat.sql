-- ════════════════════════════════════════════════════════════════════
-- 0054 — 능력 딱지를 **떼는 문** (0025 의 반쪽)
-- ════════════════════════════════════════════════════════════════════
-- ⚠️⚠️⚠️ **0025 는 붙이는 길만 냈습니다.** 운영자가 쓰는 문은
--   `grant_hat` 하나이고, 떼는 길은 `drop_my_hat`(**본인만**) 뿐입니다.
--   그래서 운영자가 잘못 붙인 딱지를 뗄 길이 **저장소에 한 줄도**
--   없었습니다 — 사장님이 Supabase SQL 편집기에서
--   `delete from account_hat …` 를 직접 치셔야 했습니다.
--   ⚠️ 0043(잇는 길만 내고 끊는 길을 안 낸 자리 · 0052 가 고쳤습니다)과
--   **같은 꼴**입니다. 여는 길을 만드는 날 닫는 길도 같이 봅니다.
--
-- ⚠️⚠️ **`biz` 는 여기서도 못 뗍니다.** 그 딱지의 주인은 사람이 아니라
--   **0028 의 트리거**입니다 (`account.role = 'provider'` 이고
--   `provider_id` 가 있으면 붙고, 아니면 떼어집니다). 여기서 떼어 봐야
--   그 계정이 다음에 한 번 바뀌는 순간 되돌아오고, 그 전까지는
--   **업체 담당자인데 사업자 딱지가 없는** 어긋난 상태가 됩니다.
--   입점을 끊는 길은 `drop_provider_staff`(0052)이고, 그 문이 계정의
--   `provider_id` 를 비우면 트리거가 딱지를 **저절로** 뗍니다.
--   ⚠️ 0025 의 `drop_my_hat` 이 "입점 해지는 관리자가 합니다" 라고 적어
--   두었는데, 그 "관리자가 하는 길" 이 바로 0052 입니다 (이 문이
--   아닙니다 — 그래서 여기서 그 말을 고쳐 적습니다).
--
-- ⚠️⚠️ **없는 딱지를 떼면 거절합니다.** 조용히 0줄로 끝내면 감사 기록에
--   "뗐다" 가 남는데 실제로는 아무 일도 안 일어난 것입니다 — 기록이
--   거짓이 됩니다 (RLS 가 UPDATE 에서 에러를 안 내는 그 자리와 같은
--   결입니다. **바뀐 줄 수**를 셉니다).
--
-- ⚠️ 까닭을 **반드시** 받습니다 (§8 · `grant_hat` 과 같은 규칙).
--
-- 되돌아갔는지 보는 법
--   select 1 from pg_proc where proname = 'revoke_hat';   -- 있어야 합니다
-- ════════════════════════════════════════════════════════════════════
begin;

create or replace function revoke_hat(p_user uuid, p_hat member_hat, p_why text)
  returns member_hat[]
  language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
  v_n  int;
begin
  if v_me is null then raise exception '로그인이 필요합니다'; end if;
  if my_role() not in ('staff','admin') then
    raise exception '회원의 역할은 운영자만 바꿉니다';
  end if;
  if p_why is null or btrim(p_why) = '' then
    raise exception '까닭을 적어야 합니다 — 감사 기록에 남습니다';
  end if;
  -- ⚠️⚠️ 위 머리말 — 이 딱지의 주인은 0028 의 트리거입니다
  if p_hat = 'biz' then
    raise exception '사업자 회원은 여기서 뗄 수 없습니다 — 업체 연결을 끊으면 저절로 떨어집니다';
  end if;
  if not exists (select 1 from account where id = p_user) then
    raise exception '그런 회원이 없습니다';
  end if;

  delete from account_hat where account_id = p_user and hat = p_hat;
  get diagnostics v_n = row_count;
  -- ⚠️⚠️ 0줄이면 **거절**합니다 (위 머리말 — 기록이 거짓이 되지 않게)
  if v_n = 0 then
    raise exception '그 회원에게 없는 역할입니다 — %', p_hat;
  end if;

  insert into audit_log (by_user, by_role, obj, obj_id, from_state, why)
  values (v_me, my_role(), 'account_hat', p_user::text, p_hat::text, p_why);

  return (select coalesce(array_agg(hat order by hat), '{}'::member_hat[])
            from account_hat where account_id = p_user);
end $$;

revoke all on function revoke_hat(uuid, member_hat, text) from public;
grant execute on function revoke_hat(uuid, member_hat, text) to authenticated;

insert into schema_version (n, name) values (54, '0054_revoke_hat')
  on conflict (n) do nothing;

commit;
