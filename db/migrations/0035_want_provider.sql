-- ════════════════════════════════════════════════════════════════════
-- 0035 — 업체 화면에서 **상담으로 가는 길** (2차 지시서 §5)
-- ════════════════════════════════════════════════════════════════════
-- ⚠️⚠️ **업체 상세 화면에 길이 없었습니다.** 손님이 업체를 보고
--   "여기 맡기고 싶다" 고 생각해도 누를 것이 없어서, 화면이 "아직
--   상담 연결을 받지 못합니다" 라고만 말하고 있었습니다 (단추를 미리
--   두지 않은 것은 맞습니다 — 절대 규칙 5). 이제 견적 흐름이 섰으니
--   그 길을 엽니다.
--
-- ⚠️⚠️⚠️ **"이 업체에 바로 간다" 고 말하면 안 됩니다.** 배정은 운영자가
--   하고, 넘기는 순간 **상호를 알리고 제3자 제공 동의를 다시** 받습니다
--   (개인정보보호법 제17조 제2항 · 0004 · 0029). 손님이 적어 주시는
--   것은 **바람**이고, 그 바람을 운영자가 봅니다. 화면도 그렇게 적습니다 —
--   "이 업체를 보고 요청하십니다. 운영자가 확인한 뒤 전달합니다."
--
-- ⚠️ 그래서 칸 이름이 `want_provider` 입니다 (`provider_id` 가 아니라).
--   이름이 곧 뜻입니다 — `assigned_provider` 로 지으면 다음 사람이
--   배정된 것으로 읽습니다.
--
-- ⚠️⚠️ **`make_request()` 를 다시 씁니다** (0029 → **0035**).
--   0029 를 다시 붙여 넣으면 이 파일이 한 일이 **조용히 내려갑니다** —
--   에러가 안 납니다. 내려갔는지는 이렇게 봅니다:
--     select prosrc like '%want_provider%' from pg_proc where proname='make_request';
--   false 면 0029 판입니다. 이 파일을 다시 올리세요.
--
-- ⚠️ 없는 업체 id 가 와도 **요청을 거절하지 않습니다.** 링크가 묵었거나
--   업체가 빠졌을 수 있는데, 그 때문에 손님의 요청이 통째로 막히면
--   안 됩니다 — 칸을 비우고 **비웠다는 사실을 감사 기록에** 남깁니다
--   (조용히 사라지지 않게).
-- ════════════════════════════════════════════════════════════════════
begin;

alter table request
  add column if not exists want_provider text references provider(id) on delete set null;

comment on column request.want_provider is
  '손님이 업체 화면에서 보고 적어 주신 **바람**입니다. 배정이 아닙니다 — '
  '배정은 운영자가 하고 그때 제3자 제공 동의를 다시 받습니다 (0035).';

create index if not exists request_want_idx
  on request (want_provider) where want_provider is not null;

-- ⚠️ 운영자가 배정 화면에서 봅니다 (0001 의 request_staff 가 이미 읽기를
--   허락하므로 정책은 그대로입니다).

create or replace function make_request(p jsonb)
  returns text language plpgsql security definer set search_path = public as $$
declare
  v_name  text := btrim(coalesce(p->>'name', ''));
  v_tel   text := btrim(coalesce(p->>'tel', ''));
  v_email text := nullif(btrim(coalesce(p->>'email', '')), '');
  v_region text := nullif(btrim(coalesce(p->>'region', '')), '');
  v_gu    text := nullif(btrim(coalesce(p->>'gu', '')), '');
  v_want  text := nullif(btrim(coalesce(p->>'want_at', '')), '');
  v_body  text := nullif(btrim(coalesce(p->>'body', '')), '');
  v_idem  text := nullif(btrim(coalesce(p->>'idem', '')), '');
  v_bmin  bigint := nullif(p->>'budget_min', '')::bigint;
  v_bmax  bigint := nullif(p->>'budget_max', '')::bigint;
  -- ⚠️ 0035 — 손님이 보고 오신 업체 (바람이지 배정이 아닙니다)
  v_wpv   text := nullif(btrim(coalesce(p->>'wantProvider', '')), '');
  v_wpv_ok text;
  v_svc   text[] := coalesce(
             (select array_agg(distinct btrim(x)) from jsonb_array_elements_text(
                case when jsonb_typeof(p->'services') = 'array'
                     then p->'services' else '[]'::jsonb end) as t(x)
              where btrim(x) <> ''), '{}'::text[]);
  v_digits text;
  v_no     text;
  v_id     uuid;
  v_try    int := 0;
  v_abc    text := '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  v_raw    text;
  k        text;
begin
  -- ⚠️ 자물쇠마다 **다른 말**로 거절합니다.
  if v_name = '' then raise exception '성함을 적어 주세요'; end if;
  if v_tel  = '' then raise exception '연락처를 적어 주세요'; end if;
  if length(v_name) > 40 then raise exception '성함이 너무 깁니다'; end if;
  if v_body is not null and length(v_body) > 2000 then
    raise exception '남기신 말씀이 너무 깁니다';
  end if;

  v_digits := regexp_replace(v_tel, '[^0-9]', '', 'g');
  -- ⚠️ 경계값: 9자리(02-xxx-xxxx)부터 11자리(010-xxxx-xxxx)까지입니다.
  if length(v_digits) < 9 or length(v_digits) > 11 then
    raise exception '연락처를 다시 봐 주세요 — 숫자 아홉에서 열한 자리입니다';
  end if;

  if array_length(v_svc, 1) is null then
    raise exception '원하시는 서비스를 하나 이상 골라 주세요';
  end if;
  if array_length(v_svc, 1) > 10 then
    raise exception '고르신 서비스가 너무 많습니다 — 열 개까지입니다';
  end if;

  -- ⚠️ 예산은 **0 도 값입니다** (무료 상담). 음수와 뒤집힌 것만 막습니다.
  if v_bmin is not null and v_bmin < 0 then raise exception '예산은 0 보다 작을 수 없습니다'; end if;
  if v_bmax is not null and v_bmax < 0 then raise exception '예산은 0 보다 작을 수 없습니다'; end if;
  if v_bmin is not null and v_bmax is not null and v_bmin > v_bmax then
    raise exception '예산의 아래가 위보다 큽니다';
  end if;

  if (p->>'agree_at') is null then
    raise exception '수집 · 이용 동의가 필요합니다';
  end if;
  if (p->>'agree_at')::timestamptz > now() + interval '5 minutes' then
    raise exception '동의 시각이 미래입니다';
  end if;
  if (p->>'agree_at')::timestamptz < now() - interval '1 day' then
    raise exception '동의가 오래되었습니다 — 다시 한 번 눌러 주세요';
  end if;

  -- ⚠️⚠️ **같은 요청을 두 번 넣는 것을 두 겹으로 막습니다.**
  --   ① idem — 화면이 한 번 연 동안 하나입니다 (두 번 눌러도 하나)
  --   ② 같은 번호로 10분 안
  if v_idem is not null then
    select id, no into v_id, v_no from request where idem = v_idem;
    if v_id is not null then return v_no; end if;   -- 이미 들어간 것입니다
  end if;
  if exists (
    select 1 from request
     where regexp_replace(tel, '[^0-9]', '', 'g') = v_digits
       and created_at > now() - interval '10 minutes')
  then
    raise exception '방금 같은 번호로 요청이 들어왔습니다 — 잠시 뒤에 다시 해 주세요';
  end if;

  -- ⚠️⚠️ **바라시는 업체가 실제로 있는가.** 없으면 **비우고 넘어갑니다** —
  --   묵은 링크 때문에 손님의 요청이 통째로 막히면 안 됩니다.
  --   ⚠️ 검사용 업체는 안 받습니다 (손님 화면에 나간 적이 없는 업체입니다).
  if v_wpv is not null then
    select id into v_wpv_ok from provider
     where id = v_wpv and listed = true and is_test = false;
  end if;

  -- 번호 — 겹치면 다시 뽑습니다 (스무 번까지)
  loop
    v_try := v_try + 1;
    v_raw := '';
    for i in 1..8 loop
      v_raw := v_raw || substr(v_abc, 1 + floor(random() * length(v_abc))::int, 1);
    end loop;
    v_no := 'SW-' || substring(v_raw from 1 for 4) || '-' || substring(v_raw from 5 for 4);
    exit when not exists (select 1 from request where no = v_no);
    if v_try > 20 then raise exception '신청번호를 만들지 못했습니다'; end if;
  end loop;

  insert into request (no, user_id, side, cat, region, gu,
                       budget_min, budget_max, want_at, body,
                       name, tel, email, agree_at, idem, want_provider)
  values (v_no, auth.uid(), 'golf',
          -- ⚠️ 분류는 **첫 서비스가 속한 분류**를 화면이 적어 보냅니다.
          nullif(btrim(coalesce(p->>'cat', '')), ''),
          v_region, v_gu, v_bmin, v_bmax, v_want, v_body,
          v_name, v_tel, v_email, (p->>'agree_at')::timestamptz, v_idem, v_wpv_ok)
  returning id into v_id;

  foreach k in array v_svc loop
    insert into request_item (request_id, service_id)
    values (v_id, k)
    on conflict (request_id, service_id) do nothing;
  end loop;

  -- ⚠️ 감사 기록에 **성함 · 연락처를 넣지 않습니다.** 신청번호로 찾아갑니다.
  -- ⚠️⚠️ 바라시는 업체를 **비운 경우 그 사실을 남깁니다** — 조용히
  --   사라지면 "왜 그 업체로 안 갔나" 를 아무도 못 댑니다.
  insert into audit_log (by_user, by_role, obj, obj_id, to_state, why, data)
  values (auth.uid(), my_role(), 'request', v_no, 'new', '매칭 요청 접수',
          jsonb_build_object('services', v_svc, 'region', v_region,
                             'cat', nullif(btrim(coalesce(p->>'cat', '')), ''),
                             'wantProvider', v_wpv_ok,
                             'wantProviderDropped',
                             (v_wpv is not null and v_wpv_ok is null)));

  return v_no;
end $$;

revoke all on function make_request(jsonb) from public;
grant execute on function make_request(jsonb) to anon, authenticated;

insert into schema_version (n, name) values (35, '0035_want_provider')
on conflict (n) do nothing;

commit;
