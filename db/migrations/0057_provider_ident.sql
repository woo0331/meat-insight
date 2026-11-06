-- ════════════════════════════════════════════════════════════════════
-- 0057 — 입점업체의 **사업자 신원정보**를 손님이 볼 수 있게 합니다
-- ════════════════════════════════════════════════════════════════════
-- ⚠️⚠️⚠️ **왜 이것이 필요한가 — 전자상거래법 제20조 제2항.**
--   통신판매중개자는 중개의뢰자(입점업체)가 사업자인 경우 그 업체의
--   **상호 · 대표자 성명 · 주소 · 전화번호 · 전자우편주소 ·
--   사업자등록번호**를 손님이 볼 수 있게 해야 합니다 (시행령 제25조).
--   공정위가 2026 년에 당근마켓에 **시정명령 + 과태료**를 부과한 조항이
--   바로 이것입니다 ("플랫폼 내에서 판매하는 사업자의 신원 정보를
--   소비자에게 제공하지 않았다").
--
--   ⚠️ 그런데 `provider` 표에는 **상호(`name`) 하나**뿐이었습니다.
--   `/pro/<id>` 화면은 `사업자등록 확인` **배지만** 내고 번호는 안 냈고,
--   입점 신청(`provider_apply`)이 받아 둔 `brn` · `tel` 은 **운영자만**
--   읽는 표에 있어서 손님에게 닿는 길이 한 곳도 없었습니다.
--   업체가 0곳인 동안은 안 걸리고, **첫 업체를 승인하시는 날** 걸립니다.
--
-- ⚠️⚠️⚠️ **0013 의 `provider_contact` 와 혼동하지 마세요 — 반대입니다.**
--     이 표(0057) : 공개해야 하는 **사업자 정보**. 손님에게 보입니다.
--     provider_contact(0013) : **배정받을 때 쓰는 담당자 직통**.
--       운영자와 그 업체만 봅니다 — 손님에게는 정책이 아예 없습니다.
--   0013 이 "`provider` 는 `listed = true` 면 로그인한 누구나 읽어서,
--   거기 직통을 넣으면 손님 전부가 담당자 휴대폰을 본다" 고 적어 둔
--   그 까닭 그대로입니다. 공개해야 하는 것은 여기, 가려야 하는 것은
--   거기 — **표를 가른 선이 공개 여부**입니다.
--
-- ⚠️⚠️ **지어내지 않습니다** (절대 규칙 1 · 제10조와 같은 결).
--   다섯 칸 모두 비울 수 있고, 비면 화면에서 **그 줄이 통째로 빠집니다.**
--   `(미기재)` 를 찍지 않습니다. 대신 업체 화면이 "아직 안 적혔습니다 —
--   운영자에게 알려 주세요" 로 **막다른 길을 막습니다** (절대 규칙 2).
--
-- ⚠️⚠️⚠️ **사업자등록번호는 업체가 못 고칩니다 — 자물쇠 두 겹.**
--     ① 0001 의 칸 단위 GRANT
--        `grant update (name, intro, regions, gu, industries, subs,
--                       since, consult_hours) on provider`
--        에 새 칸이 **하나도 없습니다** (그래서 PostgREST 로는 다섯 칸
--        전부 못 만집니다 — 고치는 길은 아래 문 둘뿐입니다).
--     ② `provider_ident_guard` 트리거가 `brn` 을 관리자만 바꾸게 막습니다.
--   ⚠️ 왜 brn 만 더 막는가: `verified.brn`(확인 배지)이 **플랫폼이 서류를
--   본 결과**입니다. 업체가 번호를 바꿀 수 있으면 배지가 가리키는 번호와
--   실제 번호가 달라져서 **그 배지가 거짓**이 됩니다 (지어낸 신뢰).
--   ⚠️ `provider_guard()`(0001→0021→0024→0030)를 **덮어쓰지 않고 따로**
--   답니다 — 0038 이 `provider_state_guard` 를 따로 단 그 까닭입니다
--   (같은 자리에 두 번 적으면 앞 번호를 다시 붙여 넣는 날 둘이 같이
--   내려갑니다).
--
-- 되돌아갔는지 보는 법
--   select count(*) from information_schema.columns
--    where table_name = 'v_provider_card' and column_name = 'brn';   -- 1 이어야 합니다
--   select count(*) from pg_trigger where tgname = 'provider_ident_guard_t';
--   ⚠️⚠️ **0032 · 0038 · 0044 파일만 따로 다시 붙여 넣으면 보기의 칸
--   다섯이 조용히 사라집니다** (그 파일들은 옛 칸 목록으로 보기를 다시
--   만듭니다). 붙여넣기 파일을 통째로 쓰시면 0057 이 뒤에 와서 다시
--   만듭니다.
-- ════════════════════════════════════════════════════════════════════
begin;

-- ── ① 칸 다섯 ──────────────────────────────────────────────────────
-- ⚠️ 전부 nullable 입니다 — 못 받은 것을 지어내지 않습니다.
alter table provider add column if not exists ceo   text;  -- 대표자 성명
alter table provider add column if not exists addr  text;  -- 영업소 주소
alter table provider add column if not exists tel   text;  -- 공개 대표번호
alter table provider add column if not exists email text;  -- 공개 전자우편
alter table provider add column if not exists brn   text;  -- 사업자등록번호

comment on column provider.tel is
  '⚠️ 공개 대표번호입니다 (손님에게 보입니다). 배정 담당자 직통은 provider_contact(0013) 입니다.';
comment on column provider.brn is
  '⚠️ 사업자등록번호. 업체는 못 고칩니다 — verified.brn 배지가 가리키는 값입니다.';

-- ⚠️⚠️ **꼴을 한 가지로 못박습니다** (`###-##-#####`). 꼴이 둘이면
--   화면이 둘 다 그려야 하고, 그러면 같은 번호가 두 모양으로 보입니다.
--   ⚠️ 넣는 쪽(문)이 하이픈을 **붙여서** 저장합니다 — check 는 마지막
--   자물쇠이지 변환기가 아닙니다.
-- ⚠️ 이름을 **적어서** 만들고 **있는지 세어** 보고 답니다 — 0053 에서
--   "이름을 글자로 박으면 다른 날 옛 제약이 그대로 남는다" 를 겪었습니다.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'provider_brn_ck') then
    alter table provider add constraint provider_brn_ck
      check (brn is null or brn ~ '^[0-9]{3}-[0-9]{2}-[0-9]{5}$');
  end if;
  if not exists (select 1 from pg_constraint where conname = 'provider_email_ck') then
    alter table provider add constraint provider_email_ck
      check (email is null or (email like '%@%.%' and length(email) <= 120));
  end if;
end $$;

-- ── ② 업체가 brn 을 못 바꾸게 (둘째 자물쇠) ────────────────────────
create or replace function provider_ident_guard() returns trigger
  language plpgsql security definer set search_path = public as $$
begin
  if my_role() = 'admin' then return new; end if;
  -- ⚠️ `is distinct from` 을 씁니다 — `<>` 는 한쪽이 null 이면 **null** 이고
  --   `if null then` 은 안 걸립니다 (0034 의 취소 문에서 자물쇠가 통째로
  --   열렸던 그 자리입니다).
  if new.brn is distinct from old.brn then
    raise exception '사업자등록번호는 업체가 바꿀 수 없습니다 — 운영자가 서류를 보고 적습니다';
  end if;
  return new;
end $$;

revoke all on function provider_ident_guard() from public;

drop trigger if exists provider_ident_guard_t on provider;
create trigger provider_ident_guard_t
  before update on provider
  for each row execute function provider_ident_guard();

-- ── ③ 업체가 적는 길 — `save_provider_self` 에 넷을 더합니다 ───────
-- ⚠️⚠️⚠️ **보낸 것으로 통째로 덮어씁니다.** 그래서 화면(`js/deskme.js`)이
--   새 칸 넷을 **읽고 또 보내야** 합니다 — 안 보내면 저장할 때마다
--   조용히 비워집니다 (2026-11-05 에 `industries` 가 실제로 그랬습니다).
--   ⚠️ `test-desk` 가 이 `update provider set` 를 **읽어서** 칸을 세므로
--   빠뜨리면 검사가 멈춥니다. 검사는 **번호를 박지 않고** 가장 뒤에서
--   이 문을 덮은 파일을 찾습니다.
-- ⚠️ `brn` 은 **여기 없습니다** (②가 막습니다 · 머리말).
-- 체인: save_provider_self (0014 → 0023 → 0044 → **0057**)
create or replace function save_provider_self(
  p_data jsonb default '{}'::jsonb,
  p_why  text  default null
) returns text
  language plpgsql security definer set search_path = public as $$
declare
  v_me   uuid     := auth.uid();
  v_role app_role := my_role();
  v_pv   text     := my_provider();
  v_scale text    := nullif(btrim(coalesce(p_data->>'scale','')), '');
  v_email text    := nullif(btrim(coalesce(p_data->>'email','')), '');
begin
  if v_me is null then raise exception '변경자를 알 수 없습니다'; end if;
  if v_role <> 'provider' or v_pv is null then
    raise exception '업체 계정으로 로그인하셔야 합니다';
  end if;
  if not exists (select 1 from provider where id = v_pv) then
    raise exception '연결된 업체를 찾을 수 없습니다';
  end if;
  if v_scale is not null and v_scale not in ('small','mid','large') then
    raise exception '거래 규모는 small · mid · large 중 하나입니다 — %', v_scale;
  end if;
  if exists (
    select 1 from jsonb_array_elements_text(
      case when jsonb_typeof(p_data->'contactWays') = 'array'
           then p_data->'contactWays' else '[]'::jsonb end) as t(x)
     where btrim(x) not in ('phone','visit','online','shop'))
  then
    raise exception '상담 방식은 전화 · 방문 · 온라인 · 매장 중에서 고르셔야 합니다';
  end if;
  -- ⚠️ 적으셨으면 꼴을 봅니다 (비우는 것은 됩니다 — 지어내지 않습니다).
  --   ⚠️⚠️ **다른 말로 거절합니다** — check 와 같은 말로 거절하면 어느
  --   자물쇠가 막았는지 알 수 없습니다 (검사가 둘을 갈라 셉니다).
  if v_email is not null and v_email not like '%@%.%' then
    raise exception '이메일 꼴이 아닙니다 — %', v_email;
  end if;

  update provider set
    intro = nullif(btrim(coalesce(p_data->>'intro','')), ''),
    regions = coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(p_data->'regions','[]'::jsonb)) x), '{}'),
    gu = coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(p_data->'gu','[]'::jsonb)) x), '{}'),
    industries = coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(p_data->'industries','[]'::jsonb)) x), '{}'),
    since = nullif(p_data->>'since','')::int,
    consult_hours = nullif(btrim(coalesce(p_data->>'consultHours','')), ''),
    brands = coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(p_data->'brands','[]'::jsonb)) x), '{}'),
    scale = v_scale,
    ceo = nullif(btrim(coalesce(p_data->>'ceo','')), ''),
    addr = nullif(btrim(coalesce(p_data->>'addr','')), ''),
    tel = nullif(btrim(coalesce(p_data->>'tel','')), ''),
    email = v_email,
    contact_ways = coalesce((select array_agg(btrim(x))
      from jsonb_array_elements_text(
        case when jsonb_typeof(p_data->'contactWays') = 'array'
             then p_data->'contactWays' else '[]'::jsonb end) x), '{}')
  where id = v_pv;

  insert into audit_log (by_user, by_role, obj, obj_id, to_state, why, data)
  values (v_me, v_role, 'provider', v_pv, 'self-updated', p_why, p_data);

  return v_pv;
end $$;

revoke all on function save_provider_self(jsonb, text) from public;
grant execute on function save_provider_self(jsonb, text) to authenticated;

-- ── ④ 운영자가 적는 길 (전화로 받아 적는 자리 · brn 포함) ──────────
-- ⚠️ 0013 의 `save_provider_contact` 와 같은 꼴입니다 — 업체가 안 적으면
--   그 기능이 반쪽이라, 운영자도 적을 수 있게 둡니다.
-- ⚠️⚠️ **인자는 `jsonb` 하나입니다** (`{ p: {...} }`). 0013 · 0003 만
--   자리 인자이고 그것이 저장소에서 예외입니다 — 새 문은 꾸러미 하나.
-- ⚠️ 보낸 칸만 고칩니다 (`p ? '칸'`) — `save_provider_self` 처럼 통째로
--   덮으면 운영자가 전화로 번호 하나만 받아 적는 날 나머지가 지워집니다.
create or replace function set_provider_ident(p jsonb default '{}'::jsonb)
  returns text
  language plpgsql security definer set search_path = public as $$
declare
  v_me   uuid     := auth.uid();
  v_role app_role := my_role();
  v_pv   text     := nullif(btrim(coalesce(p->>'provider','')), '');
  v_brn  text     := nullif(btrim(coalesce(p->>'brn','')), '');
  v_mail text     := nullif(btrim(coalesce(p->>'email','')), '');
  v_why  text     := nullif(btrim(coalesce(p->>'why','')), '');
begin
  if v_me is null then raise exception '변경자를 알 수 없습니다'; end if;
  if v_role not in ('staff','admin') then
    raise exception '업체 신원정보는 운영자가 적습니다';
  end if;
  if v_pv is null then raise exception '어느 업체인지 알 수 없습니다'; end if;
  if not exists (select 1 from provider where id = v_pv) then
    raise exception '업체를 찾을 수 없습니다 — %', v_pv;
  end if;
  -- ⚠️⚠️ **까닭을 반드시 받습니다** — 손님에게 보이는 값이고 기록에
  --   남아야 합니다 (§8). 까닭 없이 바꿀 수 있으면 누가 왜 바꿨는지
  --   아무 데도 안 남습니다.
  if v_why is null then raise exception '무엇을 보고 적으셨는지 까닭을 적어 주세요'; end if;
  -- ⚠️⚠️⚠️ **사업자등록번호는 관리자만입니다 — 직원도 거절합니다.**
  --   번호를 적는 일과 `verified.brn`(확인 배지)을 켜는 일은 **같은
  --   서류를 보는 한 사람**이어야 합니다. 배지는 `provider_guard`(0030)가
  --   관리자만 켜게 막고 있으니, 번호도 같은 선이어야 둘이 어긋나지
  --   않습니다.
  --   ⚠️ ②의 트리거도 같은 것을 막지만 **말이 다릅니다** — 자물쇠마다
  --   다른 말로 거절해야 어느 쪽이 막았는지 알 수 있습니다 (작업 기억).
  --   ⚠️⚠️ 화면도 직원에게는 그 칸을 **내지 않습니다** (그리면 눌러도
  --   거절당하는 칸입니다 · 절대 규칙 5).
  if (p ? 'brn') and v_role <> 'admin' then
    raise exception '사업자등록번호는 관리자만 적을 수 있습니다';
  end if;

  -- ⚠️ 하이픈을 **붙여서** 저장합니다 (꼴이 한 가지여야 화면이 하나만
  --   그립니다). 숫자 열 자리만 오면 여기서 꼴을 만듭니다.
  if v_brn is not null then
    v_brn := regexp_replace(v_brn, '[^0-9]', '', 'g');
    if length(v_brn) <> 10 then
      raise exception '사업자등록번호는 숫자 열 자리입니다 — %', p->>'brn';
    end if;
    v_brn := substr(v_brn,1,3) || '-' || substr(v_brn,4,2) || '-' || substr(v_brn,6,5);
  end if;
  if v_mail is not null and v_mail not like '%@%.%' then
    raise exception '이메일 꼴이 아닙니다 — %', v_mail;
  end if;

  update provider set
    ceo   = case when p ? 'ceo'   then nullif(btrim(coalesce(p->>'ceo','')),   '') else ceo   end,
    addr  = case when p ? 'addr'  then nullif(btrim(coalesce(p->>'addr','')),  '') else addr  end,
    tel   = case when p ? 'tel'   then nullif(btrim(coalesce(p->>'tel','')),   '') else tel   end,
    email = case when p ? 'email' then v_mail else email end,
    brn   = case when p ? 'brn'   then v_brn  else brn   end
  where id = v_pv;

  -- ⚠️⚠️ 기록에 **값을 담지 않습니다** — 대표자 성함이 들어갑니다.
  --   `audit_log` 는 오래 남고 보는 사람도 넓습니다 (작업 기억).
  --   무엇을 고쳤는지는 **칸 이름**으로 남깁니다.
  insert into audit_log (by_user, by_role, obj, obj_id, to_state, why, data)
  values (v_me, v_role, 'provider', v_pv, 'ident-updated', v_why,
          jsonb_build_object('fields',
            (select coalesce(jsonb_agg(k), '[]'::jsonb)
               from jsonb_object_keys(p) k
              where k in ('ceo','addr','tel','email','brn'))));

  return v_pv;
end $$;

revoke all on function set_provider_ident(jsonb) from public;
grant execute on function set_provider_ident(jsonb) to authenticated;

-- ── ⑤ 공개 보기에 칸 다섯을 더합니다 ───────────────────────────────
-- ⚠️⚠️⚠️ **안 더하면 손님에게 영원히 안 보입니다** — 에러 한 줄 없이.
--   `provider` 표는 anon 에게 열려 있지 않습니다 (0032 가 일부러 그렇게
--   두었습니다). 손님 · 크롤러에게 가는 길은 이 보기 하나이고,
--   `tools/pull-providers.js` 가 이것을 읽어 빌드가 HTML 에 찍습니다.
-- ⚠️⚠️ **`create or replace` 로는 칸을 못 늘립니다** — Postgres 가
--   "cannot change number of columns" 으로 거절합니다. 지우고 다시
--   만들고, **GRANT 를 바로 다시 줍니다** (지우면 권한도 날아가서,
--   안 주면 그날부터 `pull-providers` 가 permission denied 입니다).
-- 체인: v_provider_card (0032 → 0038 → 0044 → **0057**)
drop view if exists v_provider_card;
create view v_provider_card as
  select p.id, p.name, p.intro, p.regions, p.gu, p.subs, p.since,
         p.consult_hours, p.verified, p.brands, p.scale, p.contact_ways,
         -- ⚠️ 0057 이 더한 다섯 (제20조 제2항 · 시행령 제25조)
         p.ceo, p.addr, p.tel, p.email, p.brn,
         p.is_test
    from provider p
   where p.listed = true
     and p.is_test = false
     and p.state = 'approved';

grant select on v_provider_card to anon, authenticated;

insert into schema_version (n, name) values (57, '0057_provider_ident')
  on conflict (n) do nothing;

commit;
