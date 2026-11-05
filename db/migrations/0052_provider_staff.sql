-- ════════════════════════════════════════════════════════════════════
-- 0052 — 한 업체의 **담당자 명단**, 그리고 **내보내는 길**
-- ════════════════════════════════════════════════════════════════════
-- ⚠️⚠️⚠️ **한 업체에 담당자 여럿은 이미 됩니다.** `account.provider_id`
--   에 unique 가 없어서 여러 계정이 같은 업체를 가리킬 수 있고, 0043 의
--   초대 코드가 각자 들어오는 길입니다 (`redeem_provider_invite` 는
--   "이미 **다른** 업체에 이어진 계정" 만 거절합니다).
--   없던 것은 **그 명단을 보는 길**과 **떼는 길** 둘입니다.
--
-- ⚠️⚠️⚠️ **떼는 문이 저장소에 한 줄도 없었습니다.** 0043 머리말이
--   "옮기는 일은 운영자가 먼저 끊어야 합니다" 라고 적어 놓았는데, 끊는
--   문이 없었습니다 — 그만둔 담당자가 그 업체의 요청 · 견적 · 손님
--   성함과 연락처를 **계속 봅니다.** 사장님이 Supabase SQL 편집기에서
--   `update account set role='customer', provider_id=null` 을 직접
--   치셔야 끊겼습니다. 0051 까지 그 상태였습니다.
--
-- ⚠️⚠️ **명단은 개인정보입니다** (지시서 §0 — 기본은 비공개).
--   그래서 이름을 **갈라서** 냅니다 —
--     운영자(staff · admin)   전부 그대로 (내보낼 사람을 골라야 합니다)
--     제 줄                   제 이름 그대로 (자기 정보입니다)
--     같은 업체 동료          가려서 (`김**`) — 저장소의 관례와 같습니다
--                             (`v_review_public` · `v_cq_public`)
--   ⚠️ 동료의 uuid 도 **운영자에게만** 냅니다. 업체 담당자에게는 쓸
--     데가 없고(내보내는 단추가 없습니다), 안 주는 것이 최소 수집입니다.
--
-- ⚠️⚠️ **보기는 RLS 를 지나지 않습니다** — 임자 권한으로 돌기 때문에
--   **그 `where` 절이 자물쇠 그 자체**입니다. 여기서는 두 가지뿐입니다:
--   운영자이거나, **제 업체**(`my_provider()`)이거나.
--   ⚠️ `my_provider()` 가 NULL 인 사람(일반 회원)에게는 `a.provider_id
--   = NULL` 이 **NULL** 이 되어 줄이 안 걸립니다 — 그래서 한 줄도 안
--   보입니다. (NULL 이 자물쇠를 통째로 연 0034 의 반대 경우입니다 —
--   `where` 는 NULL 을 참으로 치지 않습니다. 그래도 아래 검사가 **일반
--   회원으로 눌러 보고** 0줄인지 셉니다.)
--
-- ⚠️ "이어진 날" 은 **초대로 들어온 분만** 있습니다. SQL 로 직접 이은
--   분(0018 의 길)에게는 그 기록이 없으므로 **NULL** 로 둡니다 —
--   화면이 그 줄을 뺍니다 (절대 규칙 2: 없는 값에 자리표시자를 찍지
--   않습니다). 지어내면 "언제 이어졌다" 는 거짓이 됩니다.
--
-- ⚠️⚠️ **`biz` 딱지를 손으로 떼지 않습니다.** 0028 의 트리거가
--   `account` 의 role · provider_id 를 보고 저절로 떼 줍니다 ("업체
--   계정이 풀려 자동으로 떨어짐"). 여기서 또 떼면 규칙이 두 곳이 되고,
--   한쪽만 고치는 날 조용히 어긋납니다.
--
-- ⚠️⚠️ **마지막 담당자는 그냥 못 뗍니다.** 배정 가능이 켜진 업체에서
--   마지막 사람을 떼면, 이미 배정된 건을 **수락 · 상담 · 견적으로 넘길
--   사람이 없습니다** (길 표의 네 걸음이 업체 전용입니다 — 0018 머리말).
--   0018 의 ③ 은 **새 배정**만 막고 이미 배정된 건은 못 구합니다.
--   그래서 이 문이 **사람 말로** 거절하고 무엇을 먼저 하라고 말합니다.
--
-- ⚠️ 두 번 돌려도 안전합니다 (drop view + create · create or replace).
-- ⚠️⚠️ 돌린 파일을 고치지 않습니다 — 다음 번호로 새로 만듭니다.
-- ════════════════════════════════════════════════════════════════════
begin;

-- ════════════════════════════════════════════════════════════════════
-- ① 보기 — 담당자 명단
--
-- ⚠️⚠️ `drop view` + `create view` 입니다 (`create or replace view` 는
--   칸을 못 늘립니다 — 0044 가 그것으로 사장님의 두 번째 붙여넣기를
--   멈춰 세웠습니다). 지우면 GRANT 도 같이 날아가므로 **바로 다시**
--   줍니다.
-- ════════════════════════════════════════════════════════════════════
drop view if exists v_provider_staff;
create view v_provider_staff as
  select
    a.provider_id,
    p.name as provider_name,
    -- ⚠️ uuid 는 운영자에게만 (내보낼 사람을 가리키는 데만 씁니다)
    case when coalesce(my_role() in ('staff','admin'), false)
         then a.id end as account_id,
    -- 이름 — 운영자는 전부 · 제 줄은 제 이름 · 동료는 가려서
    -- ⚠️ 이름이 비어 있으면 "회원" 입니다 (별표만 찍으면 고장처럼 보입니다)
    case
      when btrim(coalesce(a.name, '')) = '' then '회원'
      when coalesce(my_role() in ('staff','admin'), false)
           or a.id = auth.uid() then btrim(a.name)
      else left(btrim(a.name), 1) ||
           repeat('*', greatest(char_length(btrim(a.name)) - 1, 1))
    end as who,
    coalesce(a.id = auth.uid(), false) as is_me,
    -- ⚠️ 초대로 들어온 분만 있습니다 — 없으면 NULL (지어내지 않습니다)
    -- ⚠️⚠️ **lateral 로 하나만** 가져옵니다. 한 사람이 같은 업체에 두
    --   번 이어진 적이 있으면(내보낸 뒤 새 코드로 다시 들어온 경우)
    --   그냥 join 하면 **줄이 둘**이 되어 명단에 같은 사람이 두 번
    --   찍힙니다 (에러는 안 납니다).
    i.used_at as joined_at
  from account a
  join provider p on p.id = a.provider_id
  left join lateral (
    select max(iv.used_at) as used_at
      from provider_invite iv
     where iv.used_by = a.id and iv.provider_id = a.provider_id
  ) i on true
 where a.role = 'provider'
   and a.provider_id is not null
   and ( coalesce(my_role() in ('staff','admin'), false)
         or a.provider_id = my_provider() );

grant select on v_provider_staff to authenticated;


-- ════════════════════════════════════════════════════════════════════
-- ② 문 — 운영자가 담당자를 **내보냅니다**
--
-- ⚠️⚠️ **업체 사장님이 동료를 뗄 수 없습니다.** 남의 권한을 거두는
--   일이고, 0018 · 0043 이 "역할을 올리는 길은 운영자가 정한다" 로
--   세워 둔 선의 반대쪽입니다 — 내리는 길을 업체에 열면 그 선이
--   한쪽만 지켜집니다. 업체는 명단을 **보고** 고객센터로 알립니다.
--
-- ⚠️ 자물쇠마다 **다른 말**로 거절합니다 (어느 것이 걸렸는지 알아야
--   합니다 — 같은 말이면 하나를 빼 봐도 다른 것이 먼저 막아서 검사가
--   엉뚱한 까닭으로 통과합니다).
-- ════════════════════════════════════════════════════════════════════
create or replace function drop_provider_staff(p jsonb)
  returns text language plpgsql security definer
  set search_path = public as $$
declare
  v_me   uuid := auth.uid();
  v_u    uuid;
  v_why  text := nullif(btrim(coalesce(p->>'why', '')), '');
  v_pv   text;
  v_n    int;
  v_asg  boolean;
  v_name text;
begin
  if v_me is null then
    raise exception '로그인이 필요합니다';
  end if;
  if coalesce(my_role() in ('staff','admin'), false) = false then
    raise exception '업체 담당자를 내보내는 일은 운영자만 할 수 있습니다';
  end if;
  -- ⚠️ 못 읽는 uuid 는 **거절**합니다 (cast 가 터지면 사람 말이 아닙니다)
  begin
    v_u := nullif(btrim(coalesce(p->>'user', '')), '')::uuid;
  exception when others then
    v_u := null;
  end;
  if v_u is null then
    raise exception '어느 담당자인지 골라 주세요';
  end if;
  if v_why is null then
    raise exception '까닭을 적어야 합니다 — 감사 기록에 남습니다';
  end if;

  select provider_id into v_pv
    from account where id = v_u and role = 'provider';
  if v_pv is null then
    raise exception '그 계정은 업체 담당자가 아닙니다';
  end if;

  -- ⚠️⚠️ 세는 사이에 다른 내보내기가 끼어들면 둘 다 "나 말고 또 있다"
  --   로 읽어 **둘이 같이 빠집니다.** 업체 줄을 먼저 잠급니다
  --   (조인 정원에서 겪은 그 자리 — 0046 의 `for update`).
  select assignable, name into v_asg, v_name
    from provider where id = v_pv for update;
  select count(*) into v_n
    from account where provider_id = v_pv and role = 'provider';

  if v_n <= 1 and coalesce(v_asg, false) then
    raise exception '마지막 담당자입니다 — 먼저 배정 가능을 끄시거나 새 담당자를 초대해 주세요 (지금 내보내면 이미 배정된 건을 수락 · 상담 · 견적으로 넘길 사람이 없습니다)';
  end if;

  -- ⚠️ `biz` 딱지는 0028 의 트리거가 저절로 뗍니다 — 여기서 안 건드립니다
  update account set role = 'customer', provider_id = null where id = v_u;

  -- ⚠️⚠️ **감사 기록에 성함 · 연락처를 넣지 않습니다** — uuid 와 업체
  --   주소만 남깁니다 (`audit_log` 는 오래 남고 보는 사람도 넓습니다).
  insert into audit_log (by_user, by_role, obj, obj_id,
                         from_state, to_state, why, data)
  values (v_me, my_role(), 'account', v_u::text,
          'provider', 'customer', v_why,
          jsonb_build_object('provider', v_pv, 'left', v_n - 1));

  return v_name;
end $$;

-- ⚠️⚠️⚠️ **함수는 표와 반대입니다** — 만드는 순간 `public` 에게
--   EXECUTE 가 붙습니다. 0050 의 `notify_one` 이 그래서 **로그인한
--   누구나 아무에게 알림을 꽂을 수** 있었습니다. 거두는 줄을 같이 씁니다.
revoke all on function drop_provider_staff(jsonb) from public;
grant execute on function drop_provider_staff(jsonb) to authenticated;


insert into schema_version (n, name) values (52, '0052_provider_staff')
on conflict (n) do nothing;

commit;
