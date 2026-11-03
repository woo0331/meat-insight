-- ════════════════════════════════════════════════════════════════════
-- 0023 · 업체 분류 축 — **취급 브랜드 · 거래 규모** 두 칸
--   2026-11-02 · 더하기만 합니다 (지우는 것도 · 고치는 것도 없습니다)
--
-- ⚠️⚠️ **셋을 받아 둘만 칸으로 만들었습니다.**
--   "수리 가능 여부" 는 `provider.subs` 가 **이미** 답합니다 —
--   `catalog.js` 의 `fix`(수리 서비스) 분류에 든 하위를 하나라도 적었으면
--   수리하는 곳입니다. 거기에 boolean 을 더하면 **같은 규칙이 두 곳**이
--   되고, 이 저장소는 그렇게 어긋난 사고를 여러 번 겪었습니다
--   (`amCatTo`/`catTo` · 손으로 적어 둔 아이콘 표 둘 · `deal.js` ↔
--   `deal_move`). 화면은 `amProviderCanFix()` 로 **셉니다** — 평점과
--   포트폴리오 건수를 값으로 저장하지 않는 것과 같은 까닭입니다.
--
--     brands text[]   취급 브랜드   amShopMakers() 의 일곱 key
--     scale  text     거래 규모     small · mid · large  ⚠️ 한 칸
--
-- ⚠️⚠️ **`scale` 은 업체가 적은 값입니다** — 우리가 재 본 적이 없습니다
--   (`as` · `faq` 와 같은 결). 화면이 그 줄을 같이 냅니다. 재 본 값인
--   것처럼 쓰면 그게 지어낸 신뢰입니다 (절대 규칙 1).
-- ⚠️⚠️ **안 적은 것을 "안 한다" 로 읽지 않습니다.** 빈 `brands` 는
--   "전 브랜드" 이고 빈 `scale` 은 "모름" 입니다 — 지역 · 취급 기기를
--   그렇게 읽는 것과 같은 규칙입니다 (`subs` 만 예외: 하는 일을 안 적은
--   것을 "전부 다 합니다" 로 읽으면 안 됩니다).
--
-- ⚠️ 쓰기 권한을 **표에 주지 않습니다** — 0014 가 `revoke update on
--   provider from authenticated` 로 닫아 두었고, 바꾸는 길은 아래 문
--   둘뿐입니다 (`save_provider` · `save_provider_self`). 그래야 감사
--   기록 없이 지나갈 길이 안 생깁니다 (§8).
-- ⚠️⚠️ 승인 칸이 아닙니다 — `verified` · `listed` · `assignable` ·
--   `inhouse` 와 달리 **업체가 스스로 적는** 값이라 `provider_guard()`
--   를 안 건드립니다 (거기 넣으면 업체가 못 고칩니다).
--
-- 되돌리는 법 ───────────────────────────────────────────────────────
--   alter table provider drop column brands, drop column scale;
--   (문 둘은 0007(save_provider) · 0014(save_provider_self) 의 정의를
--    다시 돌리면 그대로 돌아옵니다 — ⚠️ 0013 이 아닙니다. 그 번호는
--    담당자 표(save_provider_contact)입니다)
--
-- ⚠️ 두 번 돌려도 안전합니다 (add column if not exists · create or replace).
-- ════════════════════════════════════════════════════════════════════

begin;

-- ════════════════════════════════════════════════════════════════════
-- ① 칸 둘
-- ════════════════════════════════════════════════════════════════════
alter table provider add column if not exists brands text[] not null default '{}';
alter table provider add column if not exists scale  text;

-- ⚠️⚠️ **값을 못박아 둡니다.** 화면의 `AM_PROVIDER_SCALE` 과 어긋나면
--   화면이 "중형" 으로 보내는데 DB 가 거절하거나, 더 나쁘게 **화면이
--   모르는 값이 DB 에 들어가** 그 업체만 규모 줄이 빕니다.
--   `build-pages.js` 의 `checkProviderAxes()` 가 **양쪽을 맞춰 봅니다** —
--   한쪽만 고치면 빌드가 멈춥니다 (`deal.js` ↔ `deal_move` 와 같은 선).
-- ⚠️ enum 을 안 쓴 까닭 — 값을 늘릴 때 `alter type` 이 필요하고 그건
--   0006 · 0015 에서 트랜잭션 때문에 걸린 자리입니다. check 제약은
--   그냥 다시 적으면 됩니다.
alter table provider drop constraint if exists provider_scale_ok;
alter table provider add constraint provider_scale_ok
  check (scale is null or scale in ('small', 'mid', 'large'));


-- ════════════════════════════════════════════════════════════════════
-- ② 직원 · 관리자가 적는 문 (0007 의 `save_provider` 를 다시 씁니다)
--
-- ⚠️⚠️ **인자를 안 늘렸습니다** — 둘 다 `p_data` 안으로 들어갑니다.
--   `approve_provider` 에 인자를 **가운데** 끼웠다가 자리로 부르던
--   쪽이 네 번째를 boolean 으로 읽어 터진 적이 있습니다 (0012).
--   `p_data` 로 받으면 `OK_ARG`(api/deal.js)도 안 바뀝니다.
-- ⚠️ 나머지 본문은 0007 그대로입니다 — 거절하는 글자까지 같습니다
--   (화면이 그 글을 그대로 보여 줍니다).
-- ════════════════════════════════════════════════════════════════════
create or replace function save_provider(
  p_id    text,
  p_name  text,
  p_data  jsonb default '{}'::jsonb,   -- intro · regions · gu · industries · subs · since · consultHours · brands · scale
  p_why   text default null
) returns text
  language plpgsql security definer set search_path = public as $$
declare
  v_me   uuid := auth.uid();
  v_role app_role := my_role();
  v_new  boolean;
  v_scale text := nullif(btrim(coalesce(p_data->>'scale','')), '');
begin
  if v_me is null then raise exception '변경자를 알 수 없습니다'; end if;
  if v_role not in ('staff','admin') then
    raise exception '업체 등록은 직원 · 관리자만 할 수 있습니다';
  end if;

  -- ⚠️⚠️ id 는 **주소가 됩니다** (`/p/<id>`). 한글을 넣으면 주소가
  -- 퍼센트 인코딩으로 길어지고 공유할 때 깨집니다.
  if p_id is null or p_id !~ '^[a-z0-9][a-z0-9-]*$' then
    raise exception '주소가 될 값은 영문 소문자 · 숫자 · 붙임표만 됩니다 — %', coalesce(p_id,'(없음)');
  end if;
  if p_name is null or btrim(p_name) = '' then
    raise exception '업체명이 없습니다';
  end if;
  -- ⚠️⚠️ `subs`(하는 일)가 비면 **아무 분류에도 안 걸립니다.** 지역과
  -- 취급 기기는 안 적으면 "전국 · 전기종" 으로 읽는 게 말이 되지만, 하는
  -- 일을 안 적은 것을 "전부 다 합니다" 로 읽으면 수거만 하는 곳이
  -- 수리 화면에 앉습니다.
  if coalesce(jsonb_array_length(coalesce(p_data->'subs','[]'::jsonb)), 0) = 0 then
    raise exception '하는 일(하위 분야)이 비어 있습니다 — 비면 아무 분류에도 안 걸립니다';
  end if;
  -- ⚠️ 모르는 규모를 **조용히 비우지 않습니다** — 화면이 오타를 보내면
  --   그 업체만 규모 줄이 빈 채로 몇 주 갑니다.
  if v_scale is not null and v_scale not in ('small','mid','large') then
    raise exception '거래 규모는 small · mid · large 중 하나입니다 — %', v_scale;
  end if;

  v_new := not exists (select 1 from provider where id = p_id);

  insert into provider (id, name, intro, regions, gu, industries, subs,
                        since, consult_hours, brands, scale)
  values (
    p_id,
    btrim(p_name),
    nullif(btrim(coalesce(p_data->>'intro','')), ''),
    coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(p_data->'regions','[]'::jsonb)) x), '{}'),
    coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(p_data->'gu','[]'::jsonb)) x), '{}'),
    coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(p_data->'industries','[]'::jsonb)) x), '{}'),
    coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(p_data->'subs','[]'::jsonb)) x), '{}'),
    nullif(p_data->>'since','')::int,
    nullif(btrim(coalesce(p_data->>'consultHours','')), ''),
    coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(p_data->'brands','[]'::jsonb)) x), '{}'),
    v_scale
  )
  on conflict (id) do update set
    name = excluded.name, intro = excluded.intro,
    regions = excluded.regions, gu = excluded.gu,
    industries = excluded.industries, subs = excluded.subs,
    since = excluded.since, consult_hours = excluded.consult_hours,
    brands = excluded.brands, scale = excluded.scale;

  insert into audit_log (by_user, by_role, obj, obj_id, to_state, why, data)
  values (v_me, v_role, 'provider', p_id,
          case when v_new then 'created' else 'updated' end, p_why, p_data);

  return p_id;
end $$;

revoke all on function save_provider(text, text, jsonb, text) from public;
grant execute on function save_provider(text, text, jsonb, text) to authenticated;


-- ════════════════════════════════════════════════════════════════════
-- ③ 업체가 **자기 줄만** 고치는 문 (0014 의 `save_provider_self`)
--
-- ⚠️⚠️ 업체가 못 건드리는 것은 그대로입니다 — 상호 · 하는 일(`subs`) ·
--   확인 배지 · 공개 · 배정 가능 · 자체 매입 · 주소(id). 하는 일을 스스로
--   넓히면 수거만 하는 곳이 수리 화면에 앉습니다.
-- ⚠️ **취급 브랜드와 거래 규모는 업체가 적습니다** — 사람이 바뀌거나
--   물량이 달라지면 그 자리에서 고칠 수 있어야 하고, 둘 다 우리가
--   확인해 주는 값이 아니라 **업체가 말하는 값**입니다.
-- ════════════════════════════════════════════════════════════════════
create or replace function save_provider_self(
  p_data jsonb default '{}'::jsonb,   -- intro · regions · gu · industries · since · consultHours · brands · scale
  p_why  text  default null
) returns text
  language plpgsql security definer set search_path = public as $$
declare
  v_me   uuid     := auth.uid();
  v_role app_role := my_role();
  v_pv   text     := my_provider();
  v_scale text    := nullif(btrim(coalesce(p_data->>'scale','')), '');
begin
  if v_me is null then raise exception '변경자를 알 수 없습니다'; end if;
  -- ⚠️⚠️ 역할을 요청에서 읽지 않습니다 — 토큰으로 `account` 를 보고
  --   거기 적힌 `provider_id` 만 고칩니다. 남의 업체는 애초에 못 집습니다.
  if v_role <> 'provider' or v_pv is null then
    raise exception '업체 계정으로 로그인하셔야 합니다';
  end if;
  if not exists (select 1 from provider where id = v_pv) then
    raise exception '연결된 업체를 찾을 수 없습니다';
  end if;
  if v_scale is not null and v_scale not in ('small','mid','large') then
    raise exception '거래 규모는 small · mid · large 중 하나입니다 — %', v_scale;
  end if;

  update provider set
    intro = nullif(btrim(coalesce(p_data->>'intro','')), ''),
    regions = coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(p_data->'regions','[]'::jsonb)) x), '{}'),
    gu = coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(p_data->'gu','[]'::jsonb)) x), '{}'),
    industries = coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(p_data->'industries','[]'::jsonb)) x), '{}'),
    since = nullif(p_data->>'since','')::int,
    consult_hours = nullif(btrim(coalesce(p_data->>'consultHours','')), ''),
    brands = coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(p_data->'brands','[]'::jsonb)) x), '{}'),
    scale = v_scale
  where id = v_pv;

  -- ⚠️ 같은 트랜잭션입니다 — 기록이 실패하면 수정도 안 됩니다 (§8).
  insert into audit_log (by_user, by_role, obj, obj_id, to_state, why, data)
  values (v_me, v_role, 'provider', v_pv, 'self-updated', p_why, p_data);

  return v_pv;
end $$;

revoke all on function save_provider_self(jsonb, text) from public;
grant execute on function save_provider_self(jsonb, text) to authenticated;


insert into schema_version (n, name) values (23, '0023_provider_axes')
on conflict (n) do nothing;

commit;
