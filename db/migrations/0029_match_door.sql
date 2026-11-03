-- ════════════════════════════════════════════════════════════════════
-- 0029 — 통합 매칭 요청을 **넣는 문** (2차 지시서 §5)
-- ════════════════════════════════════════════════════════════════════
-- 0001 이 `request` 표를, 0009 가 `request_item`(한 신청에 서비스 여럿)을
-- 만들어 두었는데 **넣는 문이 없습니다.** 앞 서비스는 서버가 service key
-- 로 넣었습니다 — 그 키는 RLS 를 통째로 지나갑니다. 검사를 다 거치는
-- 문 하나를 열고 그 문으로만 들어오게 합니다 (0027 과 같은 규칙).
--
-- ⚠️⚠️ **제3자 제공 동의를 여기서 받지 않습니다.**
--   2차 지시서 §5 의 5번은 "개인정보 처리 및 업체 제공 동의" 를 요청하는
--   자리에서 같이 받으라고 적었습니다. 그런데 그 시점에는 **어느 업체에
--   줄지 정해지지 않았습니다.** 개인정보보호법 제17조 제2항은 제공받는
--   자를 알리고 동의를 받으라고 하므로, 누구에게 줄지 모르는 상태의
--   뭉뚱그린 동의는 위반입니다.
--   그래서 여기서는 **수집 · 이용 동의(agree_at)만** 받고,
--   **제3자 제공 동의(agree3rd_at)는 배정하는 순간** 상호를 알리고
--   따로 받습니다. 그 문은 배정 화면을 세우는 날 만듭니다.
--   ⚠️ 그때까지 `agree3rd_at` 이 비어 있는 신청은 **업체에 넘기면 안
--   됩니다.** 배정 문이 그것을 막아야 합니다.
--
-- ⚠️⚠️ **신청번호는 0005 의 꼴(SW-XXXX-XXXX)을 그대로 씁니다.**
--   비회원이 번호와 연락처로 자기 신청을 찾는 문(`claim_request`)이
--   그 꼴만 받습니다. 머리글자를 바꾸면 그 함수도 같이 고쳐야 하고,
--   그러면 **0005 를 다시 붙여 넣는 날 조용히 되돌아갑니다**
--   (작업 기억의 "뒤 번호가 앞 번호를 덮는" 자리). 안 건드립니다.
--   ⚠️ SW 는 도메인(storeway)에서 온 머리입니다 — 브랜드 이름이 아닙니다.
--
-- ⚠️ 글자는 읽기 쉬운 것만 씁니다 (I · L · O · U 를 뺍니다) — 0005 의
--   정규식과 **같은 묶음**이어야 합니다.
-- ════════════════════════════════════════════════════════════════════
begin;

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
  --   ② 같은 번호로 10분 안 (지시서 §6 의 "유효 상담" · "중복 방지")
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
                       name, tel, email, agree_at, idem)
  values (v_no, auth.uid(), 'golf',
          -- ⚠️ 분류는 **첫 서비스가 속한 분류**를 화면이 적어 보냅니다.
          --    DB 는 분류 목록을 모릅니다 (그 목록은 js/data/catalog.js
          --    한 곳에 있고, 두 곳에 적으면 조용히 어긋납니다).
          nullif(btrim(coalesce(p->>'cat', '')), ''),
          v_region, v_gu, v_bmin, v_bmax, v_want, v_body,
          v_name, v_tel, v_email, (p->>'agree_at')::timestamptz, v_idem)
  returning id into v_id;

  foreach k in array v_svc loop
    insert into request_item (request_id, service_id)
    values (v_id, k)
    on conflict (request_id, service_id) do nothing;
  end loop;

  -- ⚠️ 감사 기록에 **성함 · 연락처를 넣지 않습니다.** 신청번호로 찾아갑니다.
  insert into audit_log (by_user, by_role, obj, obj_id, to_state, why, data)
  values (auth.uid(), my_role(), 'request', v_no, 'new', '매칭 요청 접수',
          jsonb_build_object('services', v_svc, 'region', v_region,
                             'cat', nullif(btrim(coalesce(p->>'cat', '')), '')));

  return v_no;
end $$;

revoke all on function make_request(jsonb) from public;
grant execute on function make_request(jsonb) to anon, authenticated;

insert into schema_version (n, name) values (29, '0029_match_door')
on conflict (n) do nothing;

commit;
