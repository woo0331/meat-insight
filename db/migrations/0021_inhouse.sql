-- ════════════════════════════════════════════════════════════════════
-- 0021 · 자체 매입 부서를 **경쟁 입찰에서 갈라 둡니다** (PHONEWAY §10)
--   2026-10-30 ⑤ 경쟁입찰
--
-- > §10 — "폰웨이 자체 매입 부서가 경쟁업체의 **비공개 입찰정보를
-- >        이용해** 부당하게 유리한 견적을 제시하지 못하도록"
--
-- ⚠️⚠️ **봉인은 이미 되어 있었습니다 — 구멍은 한 자리였습니다.**
--   재 보니 0008 의 정책이 이미 봉인 입찰입니다 —
--     · `quote_mine`   업체는 **자기 입찰만** 봅니다
--     · `assign_mine`  업체는 **자기 배정 줄만** 봅니다
--       (그래서 **누가 같이 입찰하는지도** 모릅니다)
--     · `quote_staff`  직원 · 관리자는 **전부** 봅니다 (운영자니까요)
--
--   그런데 `account` 는 `role` 과 `provider_id` 를 **둘 다** 들 수
--   있습니다. `update account set role='staff', provider_id='폰웨이'`
--   **한 줄**이면 같은 계정이
--     ① `quote_staff` 로 **경쟁 업체의 금액을 전부 보고**
--     ② `my_provider()` 로 **자기 입찰을 냅니다**
--   §10 이 막으라고 한 것이 정확히 그것이고, 오늘 **실제로 됩니다.**
--
-- ⚠️⚠️ **역할을 하나 더 만들지 않았습니다.** `inhouse` 를 app_role 에
--   더하면 `my_role()` 을 보는 자리가 **스물 몇 군데** 전부 그 값을
--   알아야 하고(길 표 · RLS · api/me.js 의 PICK · 화면), 한 곳만
--   놓치면 거기서 **아무 권한도 없는 유령**이 됩니다. 자체 매입
--   부서는 **업체 계정 그대로**입니다 — 남과 똑같이 자기 것만 봅니다.
--   달라지는 것은 **딱지 하나**(`provider.inhouse`)이고, 그건 권한이
--   아니라 **손님에게 누구인지 밝히는 표시**입니다.
--
--     ① provider.inhouse        폰웨이 자신의 매입 부서인가 (표시)
--     ② account_role_guard      업체에 이어진 계정은 직원 · 관리자가
--                               될 수 없습니다  ← **§10 의 자물쇠**
--     ③ set_provider_inhouse    그 딱지를 켜고 끄는 문 (관리자만)
--
-- ⚠️ 두 번 돌려도 안전합니다 (if not exists · create or replace).
-- ⚠️⚠️ 돌린 파일을 **고치지 않았습니다** — 다음 번호로 새로 만듭니다.
-- ════════════════════════════════════════════════════════════════════

begin;

-- ════════════════════════════════════════════════════════════════════
-- ① 자체 매입 딱지
--
-- ⚠️⚠️ **권한이 아니라 표시입니다.** 이 칸이 참이어도 보는 것 · 내는
--   것이 한 글자도 안 달라집니다 — 달라지는 것은 **손님 화면**입니다.
--   입찰을 나란히 놓을 때 "폰웨이 직접 매입" 과 "제휴 매입업체" 가
--   구분이 없으면, 손님은 누구와 거래하는지 모르는 채로 고릅니다.
--   그 자체가 §10 이 막으려는 오인입니다 (전자상거래법 제20조 제1항의
--   중개자 고지와 같은 결입니다 — 어느 건에서 우리가 **당사자**인지).
-- ⚠️ 기본값은 거짓입니다. 모르는 것을 "우리 것" 으로 두면 안 됩니다.
-- ════════════════════════════════════════════════════════════════════
alter table provider add column if not exists inhouse boolean not null default false;

comment on column provider.inhouse is
  '폰웨이 자신의 매입 부서인가 — 권한이 아니라 손님에게 밝히는 표시 (§10)';

-- 손님 화면이 "제휴 매입업체" 만 따로 세는 자리가 생깁니다
create index if not exists provider_inhouse_idx on provider (inhouse) where inhouse;


-- ════════════════════════════════════════════════════════════════════
-- ② ⚠️⚠️ **§10 의 자물쇠** — 업체에 이어진 계정은 운영자가 될 수 없습니다
--
--   입찰을 **내는 사람**과 입찰을 **다 보는 사람**이 같은 계정일 수
--   없게 합니다. 이 한 줄이 §10 입니다.
--
-- ⚠️⚠️ **반대쪽도 막습니다** — 직원 · 관리자 계정에 `provider_id` 를
--   나중에 붙이는 길도 같은 줄이 막습니다 (둘 다 update 입니다).
--
-- ⚠️ **거절하는 말이 사람 말이라야 합니다** — `api/deal.js` 가 DB 의
--   거절 글을 그대로 보여 줍니다 (0008 에서 겪은 자리).
--
-- ⚠️⚠️ **이 트리거가 막지 못하는 것** — 운영자가 **다른 메일로** 업체
--   계정을 따로 만들어 두고, 운영자 계정으로 본 금액을 그쪽에 옮겨
--   적는 것. 그건 코드가 아니라 사람의 일입니다. 여기서 하는 일은
--   **한 계정이 둘 다 할 수 없게** 하는 것까지이고, 누가 무엇을
--   바꿨는지는 `audit_log` 가 들고 있습니다 (§8).
-- ════════════════════════════════════════════════════════════════════
create or replace function account_role_guard() returns trigger
  language plpgsql security definer set search_path = public as $$
begin
  if new.provider_id is not null and new.role in ('staff','admin') then
    raise exception
      '업체에 이어진 계정은 직원 · 관리자가 될 수 없습니다 — 입찰을 내는 쪽과 입찰을 다 보는 쪽은 같은 계정일 수 없습니다 (§10)';
  end if;
  return new;
end $$;

drop trigger if exists account_role_guard_t on account;
create trigger account_role_guard_t before insert or update on account
  for each row execute function account_role_guard();

-- ⚠️⚠️ **이미 그런 줄이 있으면 여기서 멈춥니다.** 트리거는 앞으로만
--   막습니다 — 이미 있는 줄은 그대로 §10 구멍이고, 조용히 두면
--   "막았습니다" 가 거짓이 됩니다. 멈추고 어느 계정인지 말합니다.
do $$
declare v_n int; v_who text;
begin
  select count(*), coalesce(string_agg(id::text, ', '), '')
    into v_n, v_who
    from account where provider_id is not null and role in ('staff','admin');
  if v_n > 0 then
    raise exception
      '업체에 이어진 계정이 직원 · 관리자입니다 (%건: %) — 역할을 provider 로 내리거나 provider_id 를 비운 뒤 다시 돌려 주세요 (§10)',
      v_n, v_who;
  end if;
end $$;


-- ════════════════════════════════════════════════════════════════════
-- ③ 자체 매입 딱지를 켜고 끄는 문 — **관리자만**
--
-- ⚠️⚠️ **업체가 스스로 못 켭니다.** `provider_guard()` 가 한 번 더
--   막습니다 (아래) — 확인 배지 · 공개 여부와 같은 규칙입니다.
--   누가 "폰웨이 직접 매입" 딱지를 달 수 있으면 그 순간 손님이
--   누구와 거래하는지가 거짓이 됩니다 (절대 규칙 1).
-- ⚠️ `approve_provider` 에 인자를 더하지 않았습니다 — 그러면 그
--   함수의 **세 번째 사본**이 생깁니다 (0007 · 0012). 한 가지 일을
--   하는 작은 문이 낫습니다.
-- ════════════════════════════════════════════════════════════════════
create or replace function set_provider_inhouse(
  p_id  text,
  p_on  boolean,
  p_why text default null
) returns provider
  language plpgsql security definer set search_path = public as $$
declare
  v_me   uuid     := auth.uid();
  v_role app_role := my_role();
  v_pv   provider;
begin
  if v_me is null then
    raise exception '변경자를 알 수 없습니다 — 로그인한 세션에서만 됩니다';
  end if;
  if v_role <> 'admin' then
    raise exception '자체 매입 표시는 관리자만 켜고 끌 수 있습니다';
  end if;

  update provider set inhouse = coalesce(p_on, false)
   where id = p_id
   returning * into v_pv;
  if v_pv.id is null then raise exception '없는 업체입니다'; end if;

  -- ⚠️ 같은 트랜잭션입니다 — 기록이 실패하면 딱지도 안 바뀝니다 (§8)
  insert into audit_log (by_user, by_role, obj, obj_id, to_state, why)
  values (v_me, v_role, 'provider', p_id,
          case when coalesce(p_on,false) then 'inhouse:on' else 'inhouse:off' end,
          nullif(btrim(coalesce(p_why,'')), ''));
  return v_pv;
end $$;


-- ════════════════════════════════════════════════════════════════════
-- ④ 업체가 스스로 못 건드리는 칸에 `inhouse` 를 더합니다
--
-- ⚠️⚠️ 0001 의 `provider_guard()` 를 **다시 씁니다** — 트리거는 그대로
--   두고 함수 본문만 갈아 끼웁니다 (0007 이 `move_state` 를 그렇게
--   했습니다). 새 트리거를 하나 더 달면 같은 규칙이 두 곳에 적힙니다.
-- ⚠️ 0001 의 세 줄(verified · listed · id)을 **글자까지 그대로** 둡니다 —
--   화면이 그 거절 글을 그대로 보여 줍니다.
-- ════════════════════════════════════════════════════════════════════
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
  if new.inhouse is distinct from old.inhouse then
    raise exception '자체 매입 표시는 관리자가 정합니다';
  end if;
  return new;
end $$;


revoke all on function set_provider_inhouse(text, boolean, text) from public;
grant execute on function set_provider_inhouse(text, boolean, text) to authenticated;

-- ⚠️⚠️ `inhouse` 에 **쓰기 권한을 주지 않습니다.** 0001 의 GRANT 가
--   칸 단위라, 안 더하면 그대로 닫혀 있습니다 — 바꾸는 길은 위 문
--   하나뿐입니다 (`verified` · `listed` 와 같은 선).

insert into schema_version (n, name) values (21, '0021_inhouse')
on conflict (n) do nothing;

commit;
