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
--   js/data/offers.js 에 상품이 있는데 DB 에는 한 줄도 넣는 코드가
--   없었습니다. 그래서 —
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
--
-- ⚠️⚠️ **2026-11-01 — 창업 · 폐업 상품 스물일곱을 중고폰 열일곱으로
--   갈았습니다.** 이 파일은 운영 DB 에 **아직 안 돌아갔습니다**
--   (`APPLY_FROM = 8` · 사장님이 0007 까지 돌리셨습니다) — 그래서
--   새 번호를 만들지 않고 여기를 고쳤습니다 (0006 의 enum 과 같은
--   판단입니다). ⚠️ **이미 돌리신 뒤라면 이 파일을 고치지 말고 다음
--   번호로 새로 만드세요.**
-- ⚠️ `apply_type` 도 중고폰 꼴 넷입니다 — sell · quote · buy · bulk
--   (`install` · `rental` 은 창업 · 폐업 것이었습니다). 표의 그 칸은
--   제약 없는 text 라 값만 바뀌면 됩니다.
-- ════════════════════════════════════════════════════════════════════
insert into offer (id, name, lead, cats, industries, regions,
                   apply_type, needs_consult, cost_note, status) values
  ('ph-buyin', '스마트폰 직접 매입', '등급과 용량이 값을 가릅니다. 기준가가 없으면 예상 금액을 내지 않습니다.', array['buyin'], '{}', '{}', 'sell', false, 'quote', 'info'::offer_status),
  ('tab-buyin', '태블릿 · 워치 · 이어폰 매입', '스마트폰보다 기종이 적어 등급표가 단순합니다.', array['buyin'], '{}', '{}', 'sell', false, 'quote', 'info'::offer_status),
  ('self-buyin', '자급제 · 공기계 매입', '약정이 없는 기기라 명의와 잠금만 확인하면 됩니다.', array['buyin'], '{}', '{}', 'sell', false, 'quote', 'info'::offer_status),
  ('bid-match', '매입업체 경쟁입찰 중개', '저희가 사는 것이 아니라 제휴 매입업체가 입찰합니다 — 중개입니다.', array['buyin'], '{}', '{}', 'quote', false, 'quote', 'info'::offer_status),
  ('broken-buyin', '고장 · 파손폰 매입', '켜지지 않아도 값이 붙습니다. 무엇이 고장인지만 적으시면 됩니다.', array['broken'], '{}', '{}', 'sell', false, 'quote', 'info'::offer_status),
  ('part-lot', '부품용 단말기 매입', '살릴 수 없는 기기도 모듈 단위로는 거래됩니다.', array['broken'], '{}', '{}', 'sell', false, 'quote', 'info'::offer_status),
  ('fix-match', '수리 업체 연결', '기종과 증상으로 갈립니다. 부품을 구할 수 있는지가 먼저입니다.', array['fix'], '{}', '{}', 'quote', false, 'quote', 'info'::offer_status),
  ('fix-data', '데이터 복구 연결', '침수 · 액정 고장과 다른 일입니다. 복구율을 약속하지 않습니다.', array['fix'], '{}', '{}', 'quote', true, 'quote', 'info'::offer_status),
  ('shop-sale', '검수 중고폰 판매', '검수를 마친 기기만 올립니다. 등급과 배터리 상태를 같이 냅니다.', array['shop'], '{}', '{}', 'buy', false, 'quote', 'info'::offer_status),
  ('lot-whole', '등급별 벌크 도매', '대수와 등급 구성으로 값이 갈립니다. 한 대씩 보는 거래가 아닙니다.', array['wholesale'], '{}', '{}', 'bulk', true, 'quote', 'info'::offer_status),
  ('auction-fee', 'B2B 경매 중개', '참여 업체끼리 값을 냅니다 — 저희는 자리를 열고 중개합니다.', array['wholesale'], '{}', '{}', 'bulk', true, 'quote', 'info'::offer_status),
  ('corp-buyin', '기업 · 법인 대량 매입', '자산 목록과 반출 절차가 먼저입니다. 대수가 많으면 사람이 갑니다.', array['corp'], '{}', '{}', 'bulk', true, 'quote', 'info'::offer_status),
  ('wipe-cert', '데이터 완전 삭제 증명', '업무용 단말기는 삭제를 증명해야 반출이 끝납니다.', array['corp'], '{}', '{}', 'bulk', true, 'quote', 'info'::offer_status),
  ('export-buyer', '해외 바이어 연결', '나라마다 받는 등급과 기종이 다릅니다. 통관이 따라옵니다.', array['export'], '{}', '{}', 'bulk', true, 'quote', 'info'::offer_status),
  ('inspect-fee', '검수 · 등급 판정', '외관과 기능을 갈라서 봅니다. 등급은 사람이 정하고 기준을 밝힙니다.', array['inspect'], '{}', '{}', 'quote', false, 'quote', 'info'::offer_status),
  ('pickup-post', '택배 · 방문 수거', '포장이 반입니다. 깨진 액정은 따로 싸야 더 깨지지 않습니다.', array['pickup'], '{}', '{}', 'sell', false, 'quote', 'info'::offer_status),
  ('access-sale', '액세서리 · 부자재', '기기와 같이 나가는 것들입니다. 케이스 · 충전기 · 포장재.', array['access'], '{}', '{}', 'buy', false, 'quote', 'info'::offer_status)
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
