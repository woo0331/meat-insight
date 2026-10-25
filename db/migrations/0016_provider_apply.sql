-- ════════════════════════════════════════════════════════════════════
--  0016 — 업체 입점 신청을 담습니다 (2026-10-25 진단 P1-7)
-- ════════════════════════════════════════════════════════════════════
--  `/join` 으로 들어온 입점 신청이 **슬랙으로만** 가고 있었습니다.
--  채널 글이 묻히면 그 업체는 사라지고, 직원은 전화하려고 그 글을
--  찾아 **업체명 · 번호 · 하는 일을 다시 손으로 칩니다** — 그러다
--  하나라도 틀리면 `/admin` 9번 칸이 만드는 등록 줄이 어긋납니다.
--
--  ⚠️⚠️ **`provider` 에 바로 넣지 않습니다.** 신청은 아직 **업체가
--  아닙니다** — 통화도 안 해 봤고 계약도 없습니다. `provider` 에
--  꽂으면 배정 고르개에 바로 뜨고, 거기 배정되면 그 순간 손님 성함 ·
--  연락처가 **아무 합의도 없는 회사로** 넘어갑니다 (개인정보보호법
--  제17조 제2항 · 0012 의 `assignable` 을 둔 까닭 그대로).
--  통화해서 합의가 되면 **`/admin` 9번 칸**이 `provider` 줄을 만들고,
--  그때 이 신청의 `provider_id` 가 그 업체를 가리킵니다.
--
--  ⚠️⚠️ **손님에게는 한 글자도 안 나갑니다.** 아래 RLS 에 고객 정책이
--  **아예 없습니다** — 업체 담당자 표(0013)와 같은 선입니다.
--
--  ⚠️ 두 번 돌려도 안전합니다 (if not exists · create or replace ·
--  on conflict). 돌린 파일(0001)은 **고치지 않았습니다.**
-- ════════════════════════════════════════════════════════════════════

begin;

-- ── 신청 상태 넷 (js/data/deal.js 의 AM_APPLY_ST) ────────────────────
--  ⚠️⚠️ **화면의 key 와 여기가 같아야 합니다.** 어긋나면 화면이 모르는
--  값이 와서 딱지가 **조용히 빈 칸**이 됩니다 (이 저장소가 `gyeonggi` ·
--  `espresso` 로 겪은 자리) — `build-pages.js` 의 `checkDealSql()` 이
--  빌드마다 맞춰 봅니다.
--  ⚠️ `done` 은 "등록까지 끝" 이고 `drop` 은 "진행 안 함" 입니다.
--  돌아올 수 없는 것이 아니라, 다시 `called` 로 되돌릴 수 있습니다 —
--  "다음 달에 다시 연락 주세요" 를 실패로 닫지 않는 것과 같은 까닭
--  (보류에 `end:true` 를 안 붙인 그 자리).
do $$ begin
  if not exists (select 1 from pg_type where typname = 'apply_state') then
    create type apply_state as enum ('new', 'called', 'done', 'drop');
  end if;
end $$;

create table if not exists provider_apply (
  id          uuid primary key default gen_random_uuid(),
  -- 접수번호 — ⚠️ 손님(업체)에게 돌려주는 값이라 **저장된 뒤에만** 나갑니다
  no          text not null unique,
  company     text not null,
  brn         text,                        -- 사업자등록번호 (적으시면)
  name        text not null,               -- 담당자 성함
  tel         text not null,
  email       text,
  region      text,                        -- 시 · 도 이름 (화면이 보낸 글 그대로)
  industry    text,                        -- 주로 하시는 업종
  -- ⚠️ 하시는 일은 **이름 글자**입니다 (분류 key 가 아닙니다). `/join` 의
  --   칸이 자유 입력이라 key 로 바꿀 수가 없고, 바꿔 적으면 틀립니다 —
  --   등록 줄은 사람이 `/admin` 9번 칸에서 **골라서** 만듭니다.
  services    text[] not null default '{}',
  note        text,                        -- 더 하신 말씀
  -- ⚠️⚠️ 동의를 **시각으로** 남깁니다 (제15조). boolean 으로 두면
  --   "언제 받았나" 를 못 대고, 그게 분쟁에서 받지 않은 것과 같아집니다.
  agree_at    timestamptz not null,
  state       apply_state not null default 'new',
  -- 등록까지 끝난 신청이 가리키는 업체 — ⚠️ 업체를 내려도 신청은 남습니다
  provider_id text references provider(id) on delete set null,
  memo        text,                        -- 마지막으로 적은 사유 (통화 결과 등)
  moved_by    uuid references auth.users(id) on delete set null,
  moved_at    timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists provider_apply_new_idx
  on provider_apply (state, created_at desc);

alter table provider_apply enable row level security;

-- ⚠️⚠️ **고객 · 업체 정책이 없습니다 — 한 줄도 못 봅니다.** 다른 회사의
--   입점 신청이 보이면 그 자체가 유출입니다 (상호 · 담당자 · 번호).
drop policy if exists provider_apply_staff on provider_apply;
create policy provider_apply_staff on provider_apply for select
  using (my_role() in ('staff','admin'));

-- ⚠️⚠️ **읽기만 줍니다.** 쓰기를 주면 기록 없이 지나가는 길이 하나
--   생깁니다 (§8) — 0007 · 0008 · 0013 과 같은 규칙입니다. 넣는 것은
--   접수(service key)가, 상태를 바꾸는 것은 아래 문이 합니다.
-- ⚠️ `anon`(로그인 안 한 사람)에게는 아무 권한도 주지 않습니다.
grant select on provider_apply to authenticated;


-- ════════════════════════════════════════════════════════════════════
-- 상태를 바꾸는 문 하나 (§8 "변경자 · 변경일시 · 사유를 기록한다")
-- ════════════════════════════════════════════════════════════════════
create or replace function set_apply_state(
  p_apply    uuid,
  p_to       text,                       -- new | called | done | drop
  p_provider text default null,          -- 'done' 일 때 등록된 업체
  p_why      text default null
) returns uuid
  language plpgsql security definer set search_path = public as $$
declare
  v_me   uuid     := auth.uid();
  v_role app_role := my_role();
  v_was  apply_state;
  v_to   apply_state;
  v_pv   text;
begin
  if v_me is null then raise exception '변경자를 알 수 없습니다'; end if;
  if v_role not in ('staff','admin') then
    raise exception '입점 신청 처리는 직원 · 관리자만 할 수 있습니다';
  end if;

  select state, provider_id into v_was, v_pv
    from provider_apply where id = p_apply;
  if v_was is null then raise exception '없는 입점 신청입니다'; end if;

  -- ⚠️⚠️ **형변환에 맡기지 마세요.** 그대로 두면 손님 화면에
  --   `invalid input value for enum apply_state: "x"` 가 그대로 나갑니다 —
  --   0008 에서 겪은 자리입니다. 사람 말로 거절합니다.
  if p_to is null or p_to not in ('new','called','done','drop') then
    raise exception '바꿀 상태를 골라 주세요 (새 신청 · 통화함 · 등록 완료 · 진행 안 함)';
  end if;
  v_to := p_to::apply_state;

  -- ⚠️⚠️ **등록 완료는 그 업체를 가리켜야 합니다.** 안 가리키면
  --   "등록했다" 는 말만 남고 어느 업체인지가 사라져서, 나중에 이
  --   신청과 그 업체를 이을 길이 없습니다 (절대 규칙 5).
  if v_to = 'done' then
    v_pv := coalesce(nullif(btrim(coalesce(p_provider,'')), ''), v_pv);
    if v_pv is null then
      raise exception '등록 완료로 두려면 등록한 업체를 골라 주세요';
    end if;
    if not exists (select 1 from provider where id = v_pv) then
      raise exception '없는 업체입니다 — % (먼저 관리자 설정 9번 칸에서 등록하세요)', v_pv;
    end if;
  end if;

  -- ⚠️ 진행 안 함은 **사유를 받습니다** (§8). 왜 안 하기로 했는지가
  --   안 남으면 다음 사람이 그 업체에 또 전화합니다.
  if v_to = 'drop' and nullif(btrim(coalesce(p_why,'')), '') is null then
    raise exception '진행하지 않는 까닭을 적어 주세요';
  end if;

  update provider_apply
     set state = v_to,
         provider_id = case when v_to = 'done' then v_pv else provider_id end,
         -- ⚠️ 적어 주신 사유를 줄에도 남깁니다 — 목록에서 "통화했는데
         --   다음 주에 다시" 를 보려면 감사 기록을 또 묻지 않아야 합니다
         memo = coalesce(nullif(btrim(coalesce(p_why,'')), ''), memo),
         moved_by = v_me, moved_at = now()
   where id = p_apply;

  -- ⚠️⚠️ **기록과 상태 변경이 한 트랜잭션입니다** — 기록이 실패하면
  --   상태도 안 바뀝니다. 기록 없이 지나갈 길이 없습니다 (§8).
  -- ⚠️⚠️ **상호 · 성함 · 번호를 기록에 싣지 않습니다.** 감사 기록은
  --   고칠 수도 지울 수도 없는 것이라, 거기 연락처를 박으면 그 자체가
  --   또 하나의 보관입니다 (`save_provider_contact` 와 같은 규칙).
  insert into audit_log (by_user, by_role, obj, obj_id, from_state, to_state, why, data)
  values (v_me, v_role, 'provider_apply', p_apply::text,
          v_was::text, v_to::text, p_why,
          case when v_to = 'done'
               then jsonb_build_object('provider', v_pv) else '{}'::jsonb end);

  return p_apply;
end $$;

revoke all on function set_apply_state(uuid, text, text, text) from public;
grant execute on function set_apply_state(uuid, text, text, text) to authenticated;


insert into schema_version (n, name) values (16, '0016_provider_apply')
  on conflict (n) do nothing;

commit;
