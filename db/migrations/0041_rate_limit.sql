-- ════════════════════════════════════════════════════════════════════
-- 0041 — 쏟아붓기 막기 · **하루 한도**  [3차 지시서 §5 · §10]
-- ════════════════════════════════════════════════════════════════════
-- ⚠️⚠️⚠️ **처음에 적은 "10분에 다섯 건" 은 거짓이었습니다 — 지웠습니다.**
--   0029 가 이미 **같은 번호로 10분에 한 건**만 받습니다
--   ("방금 같은 번호로 요청이 들어왔습니다"). 그 위에 "10분에 다섯"
--   을 얹으면 **영원히 안 걸리는 자물쇠**입니다 — 검사는 초록이고
--   다음 차수는 그것을 자물쇠로 읽습니다 (작업 기억의 "만들어 놓고
--   안 쓰는 칸" 그 자리입니다).
--   ⚠️ **남은 틈은 "하루"** 였습니다: 10분에 한 건이면 **하루에
--   144건**이고, 아무것도 그것을 안 막았습니다. 여기서 막는 것은
--   그 하나입니다 — **하루 20건**.
--
-- ⚠️⚠️ **무엇으로 세는가.** 로그인 없이 들어오므로 user_id 가 비어
--   있습니다. 그래서 **연락처의 숫자만** 으로 셉니다 (`v_digits`) —
--   `tel` 날것으로 세면 `010-1111-2222` 와 `01011112222` 가 **다른
--   사람**이 되어 한도가 조용히 두 배가 됩니다.
--   ⚠️ IP 로 세지 않습니다: 우리는 IP 를 **받지도 저장하지도** 않고,
--   받기 시작하면 그날부터 개인정보 처리 항목이 하나 늘어 방침을
--   같이 고쳐야 합니다 (제15조 제2항). 막자고 더 받는 것은 거꾸로입니다.
--   ⚠️⚠️ **그래서 번호를 바꿔 가며 넣는 것은 못 막습니다.** 막는 척
--   하지 않습니다 — 그 자리는 운영자가 신고(0040)로 봅니다.
--
-- ⚠️⚠️ **경계값을 넉넉히 둡니다.** 레슨 · 피팅 · 부킹을 잇따라 넣는
--   것은 **정상**입니다 (너무 좁게 막는 것도 고장입니다). 10분에 한
--   건씩이면 하루 20건은 **세 시간 반**을 꼬박 넣은 것입니다.
--
-- ⚠️⚠️ **`make_request` 를 덮어씁니다** — 체인이 길어집니다:
--     make_request  0029 → 0035 → **0041**
--   0029 나 0035 를 다시 붙여 넣으면 이 자물쇠가 **조용히 내려갑니다.**
--   내려갔는지 보는 법:
--     select pg_get_functiondef('make_request(jsonb)'::regprocedure)
--            like '%하루에 보내실%';     -- false 면 옛 판입니다
--
-- ⚠️ 함수 본문은 0035 것을 **그대로 떠서** 블록 하나만 끼웠습니다
--   (손으로 옮겨 적으면 다음 함수를 통째로 삼킵니다).
-- ════════════════════════════════════════════════════════════════════
begin;

-- ⚠️ 세는 식(`숫자만`)과 **똑같은 꼴**로 색인을 만듭니다 — 날것 tel 에
--   걸면 이 질의도 · 0029 의 겹침 검사도 못 씁니다.
create index if not exists request_digits_time_idx
  on request (regexp_replace(tel, '[^0-9]', '', 'g'), created_at desc);

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

  -- ⚠️⚠️ **하루 한도 (0041).** 위가 10분을 막고, 여기가 하루를 막습니다.
  --   ⚠️ 표에 트리거로 달아 봤다가 되돌렸습니다 — 이 함수가 SECURITY
  --   DEFINER 라 트리거 안에서는 **씨앗을 넣는 운영자와 손님이 똑같이
  --   보입니다.** 가를 수가 없어 멀쩡한 지표 검사가 깨졌습니다.
  --   그리고 `request` 표에는 insert 정책도 GRANT 도 **없습니다** —
  --   손님이 넣는 길은 이 문 하나뿐이라, 자물쇠도 여기 있어야 합니다.
  --   ⚠️ 거절하는 말이 **어디로 가라**고 말해 줍니다 (막다른 길 금지).
  if (select count(*) from request
       where regexp_replace(tel, '[^0-9]', '', 'g') = v_digits
         and created_at > now() - interval '24 hours') >= 20 then
    raise exception '하루에 보내실 수 있는 요청 수를 넘었습니다 — 고객센터로 알려 주세요';
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

insert into schema_version (n, name) values (41, '0041_rate_limit')
on conflict (n) do nothing;

commit;
