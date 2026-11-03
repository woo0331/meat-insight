-- ════════════════════════════════════════════════════════════════════
-- 0028 — 업체 계정에 **사업자 회원 모자**가 저절로 따라옵니다
-- ════════════════════════════════════════════════════════════════════
-- 0025 가 member_hat('biz') 를 만들면서 "입점 신청이 승인되면 붙습니다"
-- 라고 적었습니다. 그런데 승인은 두 걸음입니다 —
--   ① set_apply_state(..., 'done', '업체주소')   신청을 업체에 잇고
--   ② update account set role='provider', provider_id='업체주소'
--      (0018 머리말 · db/README.md — **화면이 아니라 SQL 로만** 합니다)
-- 여기에 "그리고 biz 모자를 붙인다" 를 **세 번째 걸음**으로 두면,
-- 빠뜨리는 날 업체 사장님이 로그인은 되는데 업체 화면만 안 열립니다.
-- 에러도 안 납니다 — 조용히 어긋납니다.
--
-- ⚠️⚠️ 그래서 **모자를 손으로 붙이지 않습니다.** account 의 role 과
--   provider_id 가 **하나의 참**이고, 모자는 거기서 따라옵니다.
--   규칙은 한 곳(이 트리거)에 두고 모두가 그것을 부릅니다.
--
-- ⚠️ 거꾸로도 돕니다 — 업체 계정을 풀면 모자가 떨어집니다.
--   안 그러면 그만둔 업체가 업체 화면을 계속 봅니다.
--
-- ⚠️ 모자를 **직접** 붙이고 떼는 문(grant_hat)은 그대로 둡니다.
--   예외를 손으로 처리해야 하는 날이 옵니다.
-- ════════════════════════════════════════════════════════════════════
begin;

create or replace function account_biz_hat() returns trigger
  language plpgsql security definer set search_path = public as $$
declare v_is boolean;
begin
  v_is := (new.role = 'provider' and new.provider_id is not null);

  if v_is then
    insert into account_hat (account_id, hat, by_user)
    values (new.id, 'biz', auth.uid())
    on conflict (account_id, hat) do nothing;
    if not found then
      -- 이미 있던 경우에는 기록을 남기지 않습니다 (같은 줄이 쌓입니다)
      return new;
    end if;
    insert into audit_log (by_user, by_role, obj, obj_id, to_state, why)
    values (auth.uid(), my_role(), 'account_hat', new.id::text, 'biz',
            '업체 계정이 이어져 자동으로 붙음 (' || new.provider_id || ')');
  else
    delete from account_hat where account_id = new.id and hat = 'biz';
    if found then
      insert into audit_log (by_user, by_role, obj, obj_id, from_state, why)
      values (auth.uid(), my_role(), 'account_hat', new.id::text, 'biz',
              '업체 계정이 풀려 자동으로 떨어짐');
    end if;
  end if;
  return new;
end $$;

drop trigger if exists account_biz_hat_sync on account;
create trigger account_biz_hat_sync
  after insert or update of role, provider_id on account
  for each row execute function account_biz_hat();

-- ⚠️ 이미 이어져 있는 계정에도 지금 한 번 붙입니다 (따라잡기).
--    트리거는 **앞으로** 바뀌는 줄만 봅니다.
insert into account_hat (account_id, hat)
  select id, 'biz' from account
   where role = 'provider' and provider_id is not null
on conflict (account_id, hat) do nothing;

insert into schema_version (n, name) values (28, '0028_biz_hat_sync')
on conflict (n) do nothing;

commit;
