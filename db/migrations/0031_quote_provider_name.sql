-- ════════════════════════════════════════════════════════════════════
-- 0031 — 손님이 **자기에게 배정된 업체의 상호**를 볼 수 있게
-- ════════════════════════════════════════════════════════════════════
-- ⚠️⚠️ **조용히 깨져 있던 자리입니다.** 견적 비교 화면을 세우면서
--   알았습니다 —
--
--   손님 화면은 견적을 이렇게 꺼냅니다 (PostgREST 의 묶음 읽기):
--     quote?select=...,provider:provider_id(id,name)
--   그런데 묶여 나오는 `provider` 줄에도 RLS 가 걸립니다. 0001 의
--   `provider_public` 은 `listed = true` 인 줄만 열어 주므로, **공개
--   목록에 없는 업체가 낸 견적은 상호가 `null` 로** 나옵니다.
--   금액만 있고 **누가 냈는지가 없는 견적**입니다.
--
--   에러가 안 납니다. 화면은 멀쩡히 그려지고 그 칸만 빕니다 —
--   `listed = true` 인 업체로만 눌러 보면 **영원히 안 보이는** 고장입니다.
--
-- ⚠️⚠️ **이것은 가려야 할 것을 더 여는 일이 아닙니다.** 배정하는 순간
--   그 업체의 **상호를 손님에게 알리고** 제3자 제공 동의를 받았습니다
--   (개인정보보호법 제17조 제2항 · 0004 의 move_state). 이미 알려 드린
--   상호를 그 손님에게 보여 주는 것입니다. 모르는 업체가 아닙니다.
--
-- ⚠️ 여는 범위를 **그 손님 · 그 업체**로 좁힙니다 — 배정된 적이 없는
--   업체는 전과 똑같이 안 보입니다.
--
-- ⚠️⚠️ **정책 안에서 `assignment` 를 바로 읽으면 무한 재귀입니다.**
--   `assignment` 의 정책이 `request` 를 보고, `request` 의
--   `request_assigned` 가 다시 `assignment` 를 봅니다 — Postgres 가
--   *"infinite recursion detected in policy"* 로 멈춥니다 (0005 · 0008
--   에서 실제로 겪은 자리). 그래서 `security definer` 함수로 끊습니다.
--
-- ⚠️ 검사용 업체(0030)도 여기서는 보입니다. **그것이 맞습니다** —
--   배정이 실제로 있었다는 뜻이고, 그 상호는 이미 알려 드린 것입니다.
--   공개 목록 · 분류 화면 · 사이트맵은 0030 의 정책이 그대로 막습니다
--   (그 길은 `listed = true and is_test = false` 를 지나야 합니다).
-- ════════════════════════════════════════════════════════════════════
begin;

-- ⚠️ `stable` 입니다 — 한 질의 안에서 줄마다 다시 돌지 않게.
create or replace function provider_told_to_me(p_id text) returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (
    select 1
      from assignment a
      join request r on r.id = a.request_id
     where a.provider_id = p_id
       and r.user_id = auth.uid()
  )
$$;
revoke all on function provider_told_to_me(text) from public;
grant execute on function provider_told_to_me(text) to authenticated;

-- ⚠️⚠️ **0030 의 정책을 건드리지 않고 정책을 하나 더 답니다.**
--   RLS 의 select 정책 여럿은 **or 로** 묶입니다 — 0030 을 고쳐
--   조건을 늘리면 "공개 목록" 규칙과 "내 업체" 규칙이 한 덩어리가 되고,
--   한쪽을 고칠 때 다른 쪽이 같이 움직입니다. 따로 둡니다.
drop policy if exists provider_told on provider;
create policy provider_told on provider for select
  using (provider_told_to_me(id));

insert into schema_version (n, name) values (31, '0031_quote_provider_name')
on conflict (n) do nothing;

commit;
