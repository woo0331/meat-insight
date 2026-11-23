-- ════════════════════════════════════════════════════════════════════
-- ⚠️⚠️ **Preview 시험 전용 Supabase 에서만** 돌립니다. 운영 · aboutmeat · igignylgzjphtnyxhhsd 에 돌리지 마세요.
-- tools/preview-e2e.js 가 SETUP_USERS=1 로 시험 계정 여섯(관리자 포함)을 만든 **뒤에** 돌립니다.
-- 합성 업체 둘(시험 A · 시험 B)과 역할 · 업체 연결 · 배정 가능을 넣습니다. 지어낸 데이터는 이 시험 DB 안에서만 삽니다.
-- ════════════════════════════════════════════════════════════════════
begin;
do $$ begin
  if (select count(*) from auth.users where email like 'e2e-%@example.com') < 6 then
    raise exception '시험 계정 여섯이 아직 없습니다 — SETUP_USERS=1 로 먼저 만드세요';
  end if;
  if exists (select 1 from request where no not like 'SW-%') or (select count(*) from provider where id not like 'pv-test-%') > 0 then
    raise exception '시험 DB 가 아닌 것 같습니다 — 다른 업체 · 신청이 들어 있습니다. 멈춥니다';
  end if;
end $$;

insert into provider (id, name, listed, subs, regions, industries)
values ('pv-test-a','[시험] 철거 A', true, '{full}', '{gyeonggi}', '{restaurant}'),
       ('pv-test-b','[시험] 철거 B', true, '{full}', '{gyeonggi}', '{restaurant}')
on conflict (id) do nothing;

update account a set role = x.role::app_role, provider_id = x.pv
  from (values ('e2e-cust1@example.com','customer',null),
               ('e2e-cust2@example.com','customer',null),
               ('e2e-pva@example.com','provider','pv-test-a'),
               ('e2e-pvb@example.com','provider','pv-test-b'),
               ('e2e-staff@example.com','staff',null),
               ('e2e-admin@example.com','admin',null)) as x(email, role, pv)
  join auth.users u on u.email = x.email
 where a.id = u.id;

-- 계정이 이어진 뒤에야 배정 가능을 켤 수 있습니다 (0018)
update provider set assignable = true where id in ('pv-test-a','pv-test-b');

select u.email, a.role, a.provider_id from account a join auth.users u on u.id = a.id where u.email like 'e2e-%' order by 1;
commit;
