-- ════════════════════════════════════════════════════════════════════
--  0012 — 담당자 · 배정 가능 여부 · 열람 이력 · 수익상품
--  2026-10-22 "오픈 전 기능 전수검사" 보고서의 P0 ③④⑤⑦
--
--  ⚠️⚠️ **돌린 파일을 고치지 않았습니다.** 0001~0011 은 사장님이 이미
--  돌리셨으므로 그대로 두고, 바뀌는 것을 여기에 덧붙입니다
--  (db/README.md — 번호를 다시 쓰지 않습니다).
--
--  ① request.owner_id  — 이 건을 **누가 맡았는가** (지시서 §1 담당자 배정)
--  ② provider.assignable — **배정해도 되는 업체인가** (listed 와 다릅니다)
--  ③ note_request_open() — 관리자가 **연락처를 열어 본 이력**
--  ④ offer 27줄        — 수익상품이 DB 에 없어서 상품별 수수료 정책을
--                        못 만들고 있었습니다
--
--  ⚠️ 두 번 돌려도 안전합니다 (add column if not exists ·
--  on conflict do nothing · create or replace).
-- ════════════════════════════════════════════════════════════════════
begin;

-- ════════════════════════════════════════════════════════════════════
-- ① 담당자 — 이 건은 누구 것인가
--
-- ⚠️⚠️ **`audit_log.by_user` 와 다른 것입니다.** 그쪽은 "누가 바꿨나"
--   (지난 일의 기록)이고, 이것은 "지금 누가 맡고 있나" 입니다. 둘을
--   하나로 쓰면 직원이 둘이 되는 날 **같은 건에 두 사람이 전화**합니다.
-- ⚠️ 비울 수 있습니다 (null = 아직 아무도) — 담당자를 **반드시** 정해야
--   다음 걸음으로 갈 수 있게 만들지 않았습니다. 급한 건을 먼저 받고
--   담당을 나중에 정하는 것이 실제 일하는 차례입니다.
-- ════════════════════════════════════════════════════════════════════
alter table request
  add column if not exists owner_id uuid references auth.users(id) on delete set null;

-- ⚠️⚠️ **직원이 직원 목록을 볼 수 없었습니다.** `account` 의 정책이
--   `account_self`(내 줄)와 `account_admin`(관리자 전부) 둘뿐이라,
--   직원은 담당자 고르개에 **아무것도 못 채웁니다** (uuid 만 보입니다).
-- ⚠️ 그래서 **직원 · 관리자 줄만** 엽니다 — 고객 계정의 성함은 그대로
--   안 보입니다 (role 조건이 그 자리입니다).
drop policy if exists account_staff on account;
create policy account_staff on account for select
  using (my_role() in ('staff','admin') and role in ('staff','admin'));

-- ⚠️⚠️ **표에 update 권한을 주지 않습니다** — 문으로만 바꿉니다 (§8).
--   권한을 주면 기록 없이 지나가는 길이 하나 생깁니다.
create or replace function set_owner(
  p_request uuid, p_owner uuid default null, p_why text default null)
  returns void
  language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  rol app_role := my_role();
  was uuid;
  nm  text;
begin
  if uid is null then
    raise exception '변경자를 알 수 없습니다 — 로그인 후 다시 시도해 주세요';
  end if;
  if rol not in ('staff','admin') then
    raise exception '담당자 배정은 직원 · 관리자만 할 수 있습니다';
  end if;

  select owner_id into was from request where id = p_request;
  if not found then raise exception '신청을 찾을 수 없습니다'; end if;

  -- ⚠️⚠️ **아무 계정이나 담당자로 둘 수 없습니다.** 고객 계정을 담당자로
  --   꽂으면 그 사람이 "내 건" 으로 세어지고, 더 나쁘게는 그걸 보고
  --   연락처를 열어도 되는 사람으로 읽힙니다.
  if p_owner is not null then
    select name into nm from account where id = p_owner and role in ('staff','admin');
    if not found then raise exception '직원 · 관리자 계정이 아닙니다'; end if;
  end if;

  update request set owner_id = p_owner where id = p_request;

  -- ⚠️ 기록과 변경이 **한 트랜잭션**입니다 (§8)
  insert into audit_log (by_user, by_role, obj, obj_id, from_state, to_state, why, data)
  values (uid, rol, 'request', p_request::text,
          case when was is null then 'owner:none' else 'owner:set' end,
          case when p_owner is null then 'owner:none' else 'owner:set' end,
          p_why,
          -- ⚠️ 담당자 **성함은 안 적습니다** — 기록은 못 지우는 것이라
          --    이름이 박히면 영영 남습니다. id 로 충분합니다.
          jsonb_build_object('owner_id', p_owner, 'was', was));
end $$;

-- ════════════════════════════════════════════════════════════════════
-- ② 배정해도 되는 업체인가 — ⚠️⚠️ `listed` 와 **다른 것**입니다
--
--   listed      공개 목록(/providers)에 낼 것인가 — 손님에게 보이는가
--   assignable  신청을 **넘겨도 되는가** — 계약이 되어 있는가
--
-- ⚠️⚠️ **구두 제휴 합의 단계에서 이게 없으면 위험합니다.** 계약서를 쓰기
--   전에 배정되면 그 순간 손님의 성함 · 연락처가 그 업체로 넘어갑니다
--   (개인정보보호법 제17조 제3자 제공). `assign_item()` 과
--   `move_state()` 는 **업체가 있는지만** 보고 있었습니다.
-- ⚠️ 기본값은 **false** 입니다 — 등록해도 켜기 전에는 배정되지 않습니다
--   (fail-closed). 켜는 것은 관리자만입니다.
-- ════════════════════════════════════════════════════════════════════
alter table provider
  add column if not exists assignable boolean not null default false;

-- ⚠️⚠️ **트리거로 막습니다 — 함수마다 적지 않습니다.** 지금 배정이
--   생기는 길이 둘이고(`move_state` 의 배정 · `assign_item`), 앞으로
--   길이 하나 늘 때마다 같은 확인을 또 적으면 **한 곳을 잊는 날**이
--   옵니다. 줄이 만들어지는 자리가 하나라 여기서 봅니다.
-- ⚠️ 관리자도 예외가 아닙니다 — 그게 이 플래그의 뜻입니다.
create or replace function assignment_assignable() returns trigger
  language plpgsql security definer set search_path = public as $$
declare ok boolean;
begin
  select assignable into ok from provider where id = new.provider_id;
  if not found then
    raise exception '등록된 업체가 아닙니다 — %', new.provider_id;
  end if;
  if not ok then
    raise exception '아직 배정할 수 없는 업체입니다 — % (제휴 계약을 확인하고 /admin 에서 배정 가능으로 켜 주세요)',
      new.provider_id;
  end if;
  return new;
end $$;

drop trigger if exists assignment_assignable_guard on assignment;
create trigger assignment_assignable_guard
  before insert on assignment
  for each row execute function assignment_assignable();

-- 공개 · 확인 배지 · **배정 가능**을 켜는 문 (0007 의 것을 늘립니다)
-- ⚠️⚠️ **인자를 늘리면 덮어쓰기가 아니라 겹치기(overload)입니다.** 옛
--   서명을 먼저 지워야 같은 이름의 함수가 둘이 되지 않습니다 — 둘이
--   되면 어느 쪽이 불리는지가 인자 수에 따라 갈려 조용히 엉뚱한 쪽이
--   돕니다.
drop function if exists approve_provider(text, boolean, jsonb, text);
-- ⚠️⚠️ **새 인자를 맨 뒤에 둡니다.** 가운데 끼우면 자리로 부르던 쪽
--   (SQL 에서 approve_provider(id, listed, verified, why) 로 쓰던 자리)이
--   네 번째를 boolean 으로 읽어 **"invalid input syntax for type boolean"**
--   으로 터집니다 — tools/test-sql.js 에서 실제로 넷이 걸렸습니다.
create or replace function approve_provider(
  p_id         text,
  p_listed     boolean default null,
  p_verified   jsonb   default null,
  p_why        text    default null,
  p_assignable boolean default null
) returns void
  language plpgsql security definer set search_path = public as $$
declare v_me uuid := auth.uid(); v_was boolean; v_wasa boolean;
begin
  if v_me is null then raise exception '변경자를 알 수 없습니다'; end if;
  if my_role() <> 'admin' then
    raise exception '업체 공개 · 확인 배지 · 배정 가능은 관리자만 켤 수 있습니다';
  end if;
  select listed, assignable into v_was, v_wasa from provider where id = p_id;
  if not found then raise exception '없는 업체입니다 — %', p_id; end if;

  -- ⚠️ null 은 "안 건드림" 입니다 — false 와 갈라 봅니다
  update provider set
    listed     = coalesce(p_listed, listed),
    verified   = coalesce(p_verified, verified),
    assignable = coalesce(p_assignable, assignable)
  where id = p_id;

  insert into audit_log (by_user, by_role, obj, obj_id, from_state, to_state, why, data)
  values (v_me, 'admin', 'provider', p_id,
          case when v_was then 'listed' else 'hidden' end,
          case when coalesce(p_listed, v_was) then 'listed' else 'hidden' end,
          p_why,
          jsonb_build_object('verified', p_verified,
                             'assignable', coalesce(p_assignable, v_wasa),
                             'assignable_was', v_wasa));
end $$;

-- ════════════════════════════════════════════════════════════════════
-- ③ 연락처를 열어 본 이력 (개인정보보호법 제29조 — 접속기록)
--
-- ⚠️⚠️ **목록에는 성함 · 연락처가 없습니다** (api/me.js 의 PICK.staff).
--   그런데 **여는 길도 없어서** 관리자가 슬랙을 보고 전화하고 있었습니다.
--   이제 건 하나를 열면 가져오고, **열어 본 것을 기록합니다** — 기록이
--   남으면 "필요할 때만 여는" 것이 지켜집니다.
-- ⚠️ `audit_log` 에 insert 권한을 주지 않았으므로(0001) 문이 필요합니다.
-- ⚠️⚠️ **성함도 번호도 기록에 안 적습니다** — 기록은 못 지우는 것이라,
--   열어 본 이력에 연락처를 박으면 그 자체가 또 하나의 보관입니다.
--   남기는 것은 "누가 · 언제 · 어느 건을" 까지입니다.
-- ════════════════════════════════════════════════════════════════════
create or replace function note_request_open(
  p_request uuid, p_why text default null)
  returns void
  language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); rol app_role := my_role();
begin
  if uid is null then
    raise exception '변경자를 알 수 없습니다 — 로그인 후 다시 시도해 주세요';
  end if;
  if rol not in ('staff','admin') then
    raise exception '연락처 열람 기록은 직원 · 관리자만 남깁니다';
  end if;
  if not exists (select 1 from request where id = p_request) then
    raise exception '신청을 찾을 수 없습니다';
  end if;

  insert into audit_log (by_user, by_role, obj, obj_id, to_state, why)
  values (uid, rol, 'request', p_request::text, 'contact:open', p_why);
end $$;

-- ⚠️⚠️ **문만 엽니다** — 표 권한은 안 줍니다 (0007 과 같은 선)
revoke all on function set_owner(uuid, uuid, text)                              from public;
revoke all on function note_request_open(uuid, text)                            from public;
revoke all on function approve_provider(text, boolean, jsonb, text, boolean)    from public;
grant execute on function set_owner(uuid, uuid, text)                           to authenticated;
grant execute on function note_request_open(uuid, text)                         to authenticated;
grant execute on function approve_provider(text, boolean, jsonb, text, boolean) to authenticated;

-- ════════════════════════════════════════════════════════════════════
-- ④ 수익상품 — ⚠️⚠️ `offer` 표가 **비어 있었습니다**
--
--   js/data/offers.js 에 상품 스물일곱이 있는데 DB 에는 한 줄도 넣는
--   코드가 없었습니다. 그래서 —
--     · `fee_policy.offer_id` 가 offer(id) 를 가리켜서 **상품별 요율을
--       못 걸고** 업체 전체 정책만 걸렸습니다.
--     · `request.offer_id` 도 같은 FK 라, 화면이 offerId 를 보내기
--       시작하는 날 **그 접수의 저장이 통째로 실패**합니다 (접수번호가
--       안 나오고 슬랙으로만 갑니다).
--
-- ⚠️⚠️ **손으로 적은 줄이 아닙니다.** js/data/offers.js 에서 뽑았고,
--   `build-pages.js` 의 `checkOfferSql()` 이 **양쪽을 맞춰 봅니다** —
--   한쪽만 고치면 빌드가 멈춥니다 (이 저장소가 `deal.js` ↔ `deal_move`
--   로 지키는 것과 같은 방식).
-- ⚠️ `status` 는 **전부 `info`** 입니다 — 제휴사가 0곳인데 `live` 로
--   두면 "신청 가능" 으로 읽힙니다 (절대 규칙 5 · checkOffers 가 막습니다).
-- ⚠️ 업종 · 지역을 비워 둡니다 — `{}` 는 "전업종 · 전국" 입니다.
-- ════════════════════════════════════════════════════════════════════
insert into offer (id, name, lead, cats, industries, regions,
                   apply_type, needs_consult, cost_note, status) values
  ('store-internet', '매장 인터넷', '개통일을 맞추는 것이 전부입니다. 공사 일정과 함께 잡으세요.', array['it'], '{}', '{}', 'install', true, 'quote', 'info'::offer_status),
  ('pos-card', 'POS · 카드단말기', '카드 수수료와 단말기 비용은 다른 이야기입니다. 둘을 갈라서 보세요.', array['it'], '{}', '{}', 'install', true, 'quote', 'info'::offer_status),
  ('cctv-security', 'CCTV · 보안', '대수와 저장 기간이 값을 가릅니다. 녹화 보관은 법에 걸리는 부분이 있습니다.', array['it'], '{}', '{}', 'install', true, 'quote', 'info'::offer_status),
  ('water-ice-rental', '정수기 · 제빙기 렌탈', '사는 것과 빌리는 것의 차액은 계약 기간에서 갈립니다.', array['equip'], '{}', '{}', 'rental', true, 'quote', 'info'::offer_status),
  ('kiosk-order', '키오스크 · 테이블오더', '인건비를 줄이려는 것이라면 먼저 계산해 보세요.', array['it'], '{}', '{}', 'install', true, 'tool', 'info'::offer_status),
  ('interior-sign', '인테리어 · 간판', '평수보다 무엇을 뜯는가가 금액을 가릅니다.', array['interior'], '{}', '{}', 'quote', true, 'quote', 'info'::offer_status),
  ('kitchen-equip', '주방 · 업소용 장비', '새것과 중고의 차이는 값이 아니라 수리와 부품입니다.', array['equip'], '{}', '{}', 'quote', true, 'quote', 'info'::offer_status),
  ('demolish-restore', '철거 · 원상복구', '원상복구 범위는 계약서에 적힌 대로입니다. 먼저 그것부터 확인하세요.', array['demolish'], '{}', '{}', 'quote', true, 'quote', 'info'::offer_status),
  ('clean-disinfect', '청소 · 방역', '문 열기 전 한 번과 정기로 받는 것은 다른 계약입니다.', array['clean'], '{}', '{}', 'quote', false, 'quote', 'info'::offer_status),
  ('used-equip', '중고 시설 · 장비', '정리하시는 사장님의 것이 시작하시는 사장님에게 갑니다.', array['asset'], '{}', '{}', 'dispose', false, 'quote', 'info'::offer_status),
  ('signage', '간판 · 사인', '크기와 내달는 자리에 따라 구청 허가가 따로 필요할 수 있습니다.', array['interior'], '{}', '{}', 'quote', true, 'quote', 'info'::offer_status),
  ('hvac', '냉난방 · 공조', '평수보다 천장 높이와 주방 열이 용량을 가릅니다.', array['interior'], '{}', '{}', 'quote', true, 'quote', 'info'::offer_status),
  ('furniture-set', '가구 · 집기', '붙박이인지 떼어 옮길 수 있는지를 먼저 보세요 — 정리할 때 갈립니다.', array['furniture'], '{}', '{}', 'quote', true, 'quote', 'info'::offer_status),
  ('booking-order', '예약 · 주문 솔루션', '예약과 주문은 다른 프로그램일 때가 많습니다. 묶을 수 있는지 보세요.', array['it'], '{}', '{}', 'install', true, 'quote', 'info'::offer_status),
  ('marketing-svc', '오픈 마케팅', '문 열기 전에 해 두는 것과 열고 나서 하는 것이 다릅니다.', array['marketing'], '{}', '{}', 'quote', true, 'quote', 'info'::offer_status),
  ('food-supply', '식자재 거래처 연결', '품목마다 거래처가 다릅니다. 육류 · 수산 · 농산을 한 곳에서 받기는 어렵습니다.', array['supply'], '{}', '{}', 'quote', true, 'quote', 'info'::offer_status),
  ('consum-supply', '소모품 · 포장재 정기 공급', '배달용기는 단가보다 최소 수량이 부담인 경우가 많습니다.', array['supply'], '{}', '{}', 'quote', true, 'quote', 'info'::offer_status),
  ('equip-repair', '장비 수리 · 유지보수', '멈춘 뒤에 부르면 그날 장사가 안 됩니다. 정기 점검을 같이 보세요.', array['repair'], '{}', '{}', 'quote', false, 'quote', 'info'::offer_status),
  ('regular-clean', '정기 청소 · 방역', '한 번 받는 것과 주기로 받는 것은 다른 계약입니다.', array['clean'], '{}', '{}', 'quote', false, 'quote', 'info'::offer_status),
  ('place-mkt', '플레이스 · 리뷰 관리', '검색해서 찾아오는 손님이 여기서 갈립니다.', array['marketing'], '{}', '{}', 'quote', true, 'quote', 'info'::offer_status),
  ('tax-labor', '세무 · 노무 기장', '직원이 생기면 노무가 같이 따라옵니다.', array['admin'], '{}', '{}', 'quote', true, 'quote', 'info'::offer_status),
  ('transfer-ready', '매장 양도 준비', '넘기기 전에 임대차 승계와 시설 범위를 먼저 정리합니다.', array['transfer'], '{}', '{}', 'quote', true, 'quote', 'info'::offer_status),
  ('store-photo', '매장 · 시설 촬영', '사진 한 장이 보러 오시는 분의 수를 가릅니다.', array['marketing'], '{}', '{}', 'quote', false, 'quote', 'info'::offer_status),
  ('stock-clear', '재고 처분', '반품이 되는 것부터 갈라 놓으세요 — 거래처와 먼저 얻습니다.', array['stock'], '{}', '{}', 'dispose', false, 'quote', 'info'::offer_status),
  ('restore-work', '원상복구', '범위는 임대차 계약서에 적힐 대로입니다. 그것부터 확인하세요.', array['restore'], '{}', '{}', 'quote', true, 'quote', 'info'::offer_status),
  ('waste-disposal', '폐기물 처리', '사업장 폐기물은 허가받은 업체만 가져갈 수 있고 증빙이 남아야 합니다.', array['waste'], '{}', '{}', 'quote', true, 'quote', 'info'::offer_status),
  ('equip-move', '장비 철거 · 이전', '떼어서 옮기면 돈이고 부수면 비용입니다. 순서를 먼저 정하세요.', array['demolish'], '{}', '{}', 'quote', true, 'quote', 'info'::offer_status)
on conflict (id) do update set
  name = excluded.name, lead = excluded.lead, cats = excluded.cats,
  apply_type = excluded.apply_type, needs_consult = excluded.needs_consult,
  cost_note = excluded.cost_note;
-- ⚠️⚠️ `status` 를 덮어쓰지 않습니다 — 사장님이 제휴 계약을 하고
--   `live` 로 켜 두셨는데 다시 돌리면 `info` 로 **되돌아갑니다.**
--   (verified · listed 를 save_provider 가 안 건드리는 것과 같은 까닭.)

insert into schema_version (n, name) values (12, '0012_owner_assignable_offer')
on conflict (n) do nothing;

commit;
