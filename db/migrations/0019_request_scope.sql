-- ════════════════════════════════════════════════════════════════════
-- 0019 — **남의 건을 밀 수 없습니다** (2026-10-25 최종 지시서 §6 · §7)
--
-- ⚠️⚠️ **무엇이 뚫려 있었나.** `move_state()` 는 길 표(`deal_move`)에서
-- **역할만** 봅니다 — "이 상태에서 이 상태로, provider 가 갈 수 있는가".
-- 그런데 **어느 업체의 건인가**를 아무 데서도 안 봤습니다. 그래서 —
--
--     pv-two 계정으로 로그인해서
--     select move_state('<pv-one 에게 배정된 신청>','accepted','{}')
--
-- 가 **그대로 통과했습니다.** 길 표의 업체 전용 네 걸음
-- (assigned→accepted · accepted→consult · consult→quoted · quoted→nego)
-- 과 nego→signed · signed→done 이 전부 그랬습니다.
--
-- ⚠️ RLS 는 안 뚫립니다 — 그 업체는 그 신청을 **읽지는** 못합니다
-- (`request_assigned`). 하지만 `move_state` 는 security definer 라
-- RLS 를 지나가고, **쓰는 것**은 막히지 않았습니다. "읽기만 막아 두면
-- 된다" 가 아닌 자리입니다.
--
-- 무엇이 나빠지나 —
--   · 감사 기록에 **남이 수락한 것**으로 남습니다 (§8 의 뜻이 사라집니다).
--   · 경쟁 업체가 남의 건을 협의 · 계약까지 밀 수 있습니다.
--   · 고객 쪽도 같습니다 — 고객 역할은 `lost`(취소) · `hold`(보류)를
--     갈 수 있는데 **자기 신청인지**를 안 봐서, 남의 접수를 취소할 수
--     있었습니다.
--
-- ⚠️⚠️ **함수를 다시 쓰지 않았습니다.** `move_state` 는 0004 에서
-- 만들고 0007 이 다시 썼습니다 (signed 토막). 또 베껴 쓰면 **세 벌**이
-- 되고, 이 저장소는 같은 규칙을 두 곳에 적어 어긋난 사고를 여러 번
-- 겪었습니다. 그래서 **트리거**로 얹습니다 — 0018 의
-- `provider_link_guard` 와 같은 방식이고, 함수를 어떻게 고치든
-- 그 길로는 못 지나갑니다.
--
-- ⚠️ service key 로 부르는 길(접수)은 그대로 지납니다 — 그때는
-- `auth.uid()` 가 비어서 `my_role()` 이 null 이고, 이 트리거는
-- **역할이 있는 사람만** 봅니다 (접수는 로그인 없이 들어오는 것이
-- 맞습니다).
--
-- ⚠️⚠️ **운영 DB 에 자동으로 돌리지 않습니다.** 대표님이 Supabase SQL
-- Editor 에 붙여 넣으십니다.
-- ════════════════════════════════════════════════════════════════════

begin;

create or replace function request_scope_check() returns trigger
  language plpgsql security definer set search_path = public as $$
declare v_role app_role := my_role(); v_pv text;
begin
  -- 상태가 안 바뀌면 볼 것이 없습니다 (담당자 · 메모만 고친 경우)
  if new.state is not distinct from old.state then return new; end if;

  -- ⚠️ 역할이 없으면 서버(service key)입니다 — 접수가 그 길입니다
  if v_role is null then return new; end if;
  -- 직원 · 관리자는 전부 봅니다 (그게 일입니다)
  if v_role in ('staff','admin') then return new; end if;

  if v_role = 'provider' then
    v_pv := my_provider();
    if v_pv is null then
      raise exception '업체 계정에 업체가 이어져 있지 않습니다 — 관리자에게 알려 주세요';
    end if;
    -- ⚠️⚠️ **배정된 업체만**입니다. 남의 건을 수락 · 상담 · 견적 ·
    --   협의로 밀면 그 기록이 거짓이 됩니다 (§8).
    if not exists (select 1 from assignment
                    where request_id = new.id and provider_id = v_pv) then
      raise exception '이 신청에 배정된 업체가 아닙니다 — 남의 건은 진행할 수 없습니다';
    end if;
    return new;
  end if;

  if v_role = 'customer' then
    -- ⚠️⚠️ **자기 신청만**입니다. 고객 역할이 갈 수 있는 길은 취소와
    --   보류뿐인데, 남의 접수를 취소할 수 있으면 그것만으로 사고입니다.
    -- ⚠️ 아직 아무에게도 안 붙은 접수(user_id null)는 고객 역할로
    --   건드릴 수 없습니다 — 번호 + 연락처로 가져가신 뒤입니다
    --   (`claim_request`).
    if new.user_id is null or new.user_id <> auth.uid() then
      raise exception '내 신청이 아닙니다 — 신청번호와 연락처로 먼저 가져와 주세요';
    end if;
    return new;
  end if;

  raise exception '이 신청을 바꿀 수 있는 역할이 아닙니다';
end $$;

drop trigger if exists request_scope_guard on request;
create trigger request_scope_guard
  before update of state on request
  for each row execute function request_scope_check();

-- ── 판 번호 ──────────────────────────────────────────────────────────
insert into schema_version (n, name) values (19, '0019_request_scope')
  on conflict (n) do nothing;

commit;
