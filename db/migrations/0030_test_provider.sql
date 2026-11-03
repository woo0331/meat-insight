-- ════════════════════════════════════════════════════════════════════
-- 0030 — **검사용 업체**를 참 업체와 갈라 둡니다 (2차 지시서 §8)
-- ════════════════════════════════════════════════════════════════════
-- 지시서 §8 이 "실제 데이터와 테스트 데이터를 구분한다" 고 적었고,
-- §1 과 절대 규칙 1 이 **없는 업체를 손님에게 보이는 것**을 금지합니다
-- (표시 · 광고의 공정화에 관한 법률 제3조). 그런데 지금 `provider` 표에는
-- 그 둘을 가를 칸이 **없습니다.**
--
-- ⚠️⚠️ **왜 지금 필요한가.** 상담 → 배정 → 견적 → 고르기 흐름은
--   업체가 있어야 눌러 볼 수 있습니다. 참 업체가 0곳인 동안 그 자리를
--   한 번도 안 눌러 보고 두면, 첫 업체가 들어온 날 **그때 처음** 깨진
--   것을 알게 됩니다. 그래서 검사용 업체를 넣어 눌러 보는데 —
--   **그 줄이 손님 화면으로 새면 그 순간 없는 회사를 광고하는 것**입니다.
--   칸 하나로 그 길을 끊습니다.
--
-- ⚠️⚠️ **`listed` 와 다른 칸입니다.** 셋이 하는 일이 다릅니다 —
--     listed      공개 목록에 낼 것인가           (관리자가 정합니다)
--     assignable  신청을 넘겨도 되는가             (계약 · 계정 연결)
--     is_test     **참 업체가 아닙니다**           (지우기 전까지 영원히)
--   `listed = false` 로만 숨기면 누군가 공개를 켜는 날 조용히 손님에게
--   나갑니다. `is_test` 는 **공개 정책 자체가** 걸러서, 켜도 안 나갑니다.
--
-- ⚠️⚠️ **앞으로 세는 자리는 전부 `is_test = false` 로 좁혀야 합니다.**
--   매각 지표(2차 지시서 §9 — MAU · 유효 상담 비율 · 거래액)에 검사용
--   줄이 섞이면 그건 **투자자에게 하는 거짓말**입니다. 지금 세는 곳은
--   `js/account.js` 의 관리자 현황 하나이고, 거기서는 검사용을 **따로**
--   셉니다 (섞지 않고 갈라 보여 줍니다).
--
-- ⚠️ 돌려도 참 자료가 바뀌지 않습니다 — default false 라 기존 줄은
--   전부 참 업체로 남습니다 (not null 을 default 와 **같이** 적는
--   까닭입니다. default 없이 not null 을 붙이면 줄이 있는 표에서
--   그 자리에서 터집니다).
--
-- ⚠️⚠️ **`provider_guard()` 를 네 번째로 다시 씁니다**
--   (0001 → 0021 → 0024 → 0030). 앞 번호를 다시 붙여 넣으면 이 파일이
--   한 일이 **조용히 내려갑니다** — 에러가 안 납니다. 내려갔는지는
--   이렇게 봅니다:
--     select prosrc like '%is_test%' from pg_proc where proname='provider_guard';
--   false 면 앞 판입니다. 이 파일을 다시 올리세요.
--
-- ⚠️ 씨앗은 여기 넣지 않습니다 — `db/seed/test-providers.sql` 입니다.
--   마이그레이션에 넣으면 운영 DB 를 올리는 날 **검사용 업체가 같이**
--   올라갑니다.
-- ════════════════════════════════════════════════════════════════════
begin;

-- ── ① 칸 ────────────────────────────────────────────────────────────
alter table provider
  add column if not exists is_test boolean not null default false;

comment on column provider.is_test is
  '참 업체가 아닙니다 (검사용). 공개 정책이 걸러 손님 화면에 안 나갑니다. '
  '세는 자리는 전부 is_test = false 로 좁혀야 합니다 — 2차 지시서 §8.';

-- ⚠️ 공개 목록을 꺼낼 때마다 보는 칸이라 인덱스를 같이 둡니다.
create index if not exists provider_live_idx
  on provider (listed) where is_test = false;


-- ── ② 공개 정책 — 검사용은 **anon 에게 한 줄도** 안 갑니다 ──────────
-- ⚠️⚠️ 0001 의 정책을 **덮어씁니다.** 0001 을 다시 붙여 넣으면 이것이
--   내려가고 검사용 업체가 공개됩니다 — 위 머리말의 확인 질의와 같은
--   자리입니다.
-- ⚠️ 운영자와 **그 업체 자신**은 그대로 봅니다. 안 보이면 눌러 볼
--   수가 없고, 배정 화면에서 고를 수도 없습니다.
drop policy if exists provider_public on provider;
create policy provider_public on provider for select
  using ((listed = true and is_test = false)
         or my_role() in ('staff','admin')
         or id = my_provider());


-- ── ③ 업체가 스스로 끌 수 없게 ─────────────────────────────────────
-- ⚠️⚠️ **업체가 `is_test` 를 끄면 그 자리에서 공개됩니다.** `listed` ·
--   `verified` 와 같은 종류의 칸이라 같은 자물쇠에 넣습니다.
-- ⚠️ 거절하는 말을 **다른 말로** 둡니다 — 자물쇠가 겹치면 어느 것이
--   막았는지 알 수 없고, 검사가 엉뚱한 까닭으로 통과합니다.
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
  if new.is_test is distinct from old.is_test then
    raise exception '검사용 표시는 관리자만 바꿀 수 있습니다';
  end if;
  return new;
end $$;


-- ── ④ 검사용 줄이 섞이지 않게 세는 손잡이 ──────────────────────────
-- ⚠️⚠️ **왜 함수인가.** 관리자 화면은 PostgREST 로 `provider` 를 세는데,
--   운영자에게는 검사용 줄도 보입니다 (② 의 정책). 그래서 화면이 센
--   값은 **검사용이 섞인 값**이고, 그것을 "업체 수" 라고 찍으면 그
--   화면부터 이미 틀린 숫자입니다.
--   PostgREST 로 `is_test=eq.false` 를 붙일 수도 있지만, 그러면 **화면이
--   그 조건을 기억해야** 하고 새 화면을 만드는 날 빠집니다 (같은 규칙을
--   두 곳에 적는 자리입니다). 세는 규칙을 DB 에 한 번 둡니다.
-- ⚠️ 돌려주는 것은 **숫자 둘**입니다 — 사람 정보가 아닙니다.
-- ⚠️⚠️ **0 을 null 로 섞지 않습니다.** 못 읽은 것과 0건은 다릅니다 —
--   읽을 수 없으면 거절(exception)하고, 0건이면 0 을 돌려줍니다.
create or replace function provider_counts() returns jsonb
  language plpgsql stable security definer set search_path = public as $$
declare v_live int; v_test int;
begin
  if my_role() not in ('staff','admin') then
    raise exception '업체 수는 직원 · 관리자만 볼 수 있습니다';
  end if;
  select count(*) into v_live from provider where is_test = false;
  select count(*) into v_test from provider where is_test = true;
  return jsonb_build_object('real', v_live, 'test', v_test);
end $$;

revoke all on function provider_counts() from public;
grant execute on function provider_counts() to authenticated;

insert into schema_version (n, name) values (30, '0030_test_provider')
on conflict (n) do nothing;

commit;
