-- ════════════════════════════════════════════════════════════════════
-- 0024 — 중고폰 찌꺼기를 걷어냅니다 (골프올인원 전환)
-- ════════════════════════════════════════════════════════════════════
-- ⚠️⚠️ **운영 DB 에는 돌릴 것이 거의 없습니다.** 운영에는 0001~0007 만
--   돌아가 있고, 여기서 지우는 것들(0012 의 수익상품 씨앗 · 0020 의 기기
--   재고 · 0021 의 자체 매입 표시)은 **운영에서 한 번도 안 돈 파일**이
--   만든 것입니다. 그래서 전부 if exists 로 적었습니다 — 없으면 조용히
--   지나갑니다.
--
-- ⚠️⚠️ **번호를 다시 쓰지 않습니다.** 0012 · 0020 · 0021 파일은 그대로
--   둡니다 (돌린 기록입니다). 지우는 일은 여기 새 번호로 적습니다.
--
-- ⚠️⚠️ **provider_guard() 를 여기서 다시 씁니다.** 0021 판이 new.inhouse
--   를 보는데 그 칸을 지우기 때문입니다. 그래서 **0021 을 다시 붙여
--   넣으면 이 파일이 한 일이 통째로 되돌아갑니다** (칸도 함수도 돌아
--   옵니다). create or replace 는 에러를 안 냅니다 — 조용히 내려갑니다.
--   되돌아갔는지는 이렇게 봅니다:
--     select prosrc like '%inhouse%' from pg_proc where proname='provider_guard';
--   true 면 0021 판입니다. 이 파일을 다시 올리세요.
--
-- 지우는 것
--   ① 0012 가 심은 중고폰 수익상품 열일곱 줄 (offer)
--   ② 0020 의 기기 재고 — device · device_check · device_cost · device_move
--      와 그 문 넷, 종류 둘
--   ③ 0021 의 provider.inhouse 와 set_provider_inhouse()
-- 남기는 것 (업종과 무관합니다 — 지우면 안 됩니다)
--   · account_role_guard()  역할 올리기를 막는 자물쇠 (0021)
--   · provider_guard()      확인 배지 · 공개 여부 · 주소를 지키는 자물쇠
-- ════════════════════════════════════════════════════════════════════
begin;

-- ① 중고폰 수익상품 ------------------------------------------------
-- ⚠️ id 를 적어서 지웁니다. cats 로 지우면 나중에 같은 이름의 골프
--    분류가 생겼을 때 엉뚱한 줄이 같이 사라집니다.
delete from offer where id in (
  'ph-buyin','tab-buyin','self-buyin','bid-match','broken-buyin','part-lot',
  'fix-match','fix-data','shop-sale','lot-whole','auction-fee','corp-buyin',
  'wipe-cert','export-buyer','inspect-fee','pickup-post','access-sale'
);

-- ② 기기 재고 ------------------------------------------------------
-- ⚠️ 인자를 적지 않습니다. 손으로 적으면 **한 글자만 달라도 조용히
--    안 지워집니다** (여기서 int 와 bigint 를 틀려 겪었습니다).
--    이름이 하나뿐이라 Postgres 10 이상에서는 이름만으로 됩니다.
drop function if exists make_device;
drop function if exists add_device_cost;
drop function if exists add_device_check;
drop function if exists move_device;
-- ⚠️ 보기(view)를 먼저 지웁니다 — 표를 보고 있어서 cascade 없이는
--    안 지워집니다. cascade 를 쓰면 딸려 나가는 것이 더 있어도 조용히
--    같이 사라져서, 무엇이 지워졌는지 알 수 없습니다.
drop view if exists v_device_pl;
drop table if exists device_cost;
drop table if exists device_check;
drop table if exists device_move;
drop table if exists device;
drop type if exists device_cost_kind;
drop type if exists device_state;

-- ③ 자체 매입 표시 --------------------------------------------------
drop function if exists set_provider_inhouse;

-- ⚠️ 칸을 지우기 전에 그 칸을 보는 자물쇠를 먼저 다시 씁니다.
--    순서를 바꾸면 트리거가 없는 칸을 보고 업체 수정이 통째로 막힙니다.
create or replace function provider_guard() returns trigger
  language plpgsql security definer set search_path = public as $$
begin
  if my_role() = 'admin' then return new; end if;
  if new.verified is distinct from old.verified then
    raise exception '확인 배지는 플랫폼이 서류를 확인한 뒤에만 켜집니다';
  end if;
  if new.listed is distinct from old.listed then
    raise exception '공개 여부는 관리자가 정합니다';
  end if;
  if new.id is distinct from old.id then
    raise exception '업체 주소(id)는 바꿀 수 없습니다 — 이미 색인된 주소입니다';
  end if;
  return new;
end $$;

drop index if exists provider_inhouse_idx;
alter table provider drop column if exists inhouse;

insert into schema_version (n, name) values (24, '0024_golf_reset')
on conflict (n) do nothing;

commit;
