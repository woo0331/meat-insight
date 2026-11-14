-- 0071_pro_self · 운영 DB 판이 70 일 때만 실행합니다
alter table provider_apply
  add column if not exists by_user uuid references auth.users(id) on delete set null;
create index if not exists provider_apply_byuser_idx
  on provider_apply (by_user) where by_user is not null;
create or replace function make_apply(p jsonb)
  returns text language plpgsql security definer set search_path = public as $$
declare
  v_company  text := btrim(coalesce(p->>'company', ''));
  v_name     text := btrim(coalesce(p->>'name', ''));
  v_tel      text := btrim(coalesce(p->>'tel', ''));
  v_email    text := nullif(btrim(coalesce(p->>'email', '')), '');
  v_brn      text := nullif(btrim(coalesce(p->>'brn', '')), '');
  v_region   text := nullif(btrim(coalesce(p->>'region', '')), '');
  v_addr     text := nullif(btrim(coalesce(p->>'addr', '')), '');
  v_note     text := nullif(btrim(coalesce(p->>'note', '')), '');
  v_svc      text[] := coalesce(
                 (select array_agg(btrim(x)) from jsonb_array_elements_text(
                    case when jsonb_typeof(p->'services') = 'array'
                         then p->'services' else '[]'::jsonb end) as t(x)
                  where btrim(x) <> ''), '{}'::text[]);
  v_digits   text;
  v_no       text;
begin
  -- ⚠️ 자물쇠마다 **다른 말**로 거절합니다. 같은 말이면 하나를 빼 봐도
  --    다른 것이 먼저 막아 엉뚱한 까닭으로 통과합니다.
  if v_company = '' then raise exception '상호를 적어 주세요'; end if;
  if v_name    = '' then raise exception '담당자 성함을 적어 주세요'; end if;
  if v_tel     = '' then raise exception '연락처를 적어 주세요'; end if;
  if length(v_company) > 80  then raise exception '상호가 너무 깁니다'; end if;
  if length(v_name)    > 40  then raise exception '성함이 너무 깁니다'; end if;
  -- ⚠️ 새 칸도 길이를 막습니다 — 안 막으면 2천 자짜리 주소가 들어옵니다
  if v_addr is not null and length(v_addr) > 200 then
    raise exception '사업장 주소가 너무 깁니다';
  end if;
  if v_note is not null and length(v_note) > 2000 then
    raise exception '남기신 말씀이 너무 깁니다';
  end if;
  v_digits := regexp_replace(v_tel, '[^0-9]', '', 'g');
  -- ⚠️ 경계값: 9자리(02-xxx-xxxx)부터 11자리(010-xxxx-xxxx)까지입니다.
  if length(v_digits) < 9 or length(v_digits) > 11 then
    raise exception '연락처를 다시 봐 주세요 — 숫자 아홉에서 열한 자리입니다';
  end if;
  if array_length(v_svc, 1) is null then
    raise exception '하시는 일을 하나 이상 골라 주세요';
  end if;
  if array_length(v_svc, 1) > 20 then
    raise exception '고르신 항목이 너무 많습니다';
  end if;
  -- ⚠️⚠️ 동의 시각은 **화면이 보낸 값**입니다. 미래이거나 너무 오래된
  --    것은 믿지 않습니다 (개인정보보호법 제15조 — 그 자리에서 받은
  --    동의여야 합니다).
  if (p->>'agree_at') is null then
    raise exception '수집 · 이용 동의가 필요합니다';
  end if;
  if (p->>'agree_at')::timestamptz > now() + interval '5 minutes' then
    raise exception '동의 시각이 미래입니다';
  end if;
  if (p->>'agree_at')::timestamptz < now() - interval '1 day' then
    raise exception '동의가 오래되었습니다 — 다시 한 번 눌러 주세요';
  end if;
  -- 중복 · 허위 신청 막기 (지시서 5번 A)
  if exists (
    select 1 from provider_apply
     where regexp_replace(tel, '[^0-9]', '', 'g') = v_digits
       and state = 'new'
       and created_at > now() - interval '10 minutes')
  then
    raise exception '방금 같은 번호로 신청이 들어왔습니다 — 잠시 뒤에 다시 해 주세요';
  end if;
  v_no := 'GA' || to_char(now() at time zone 'Asia/Seoul', 'YYMMDD')
               || '-' || lpad(nextval('apply_no_seq')::text, 4, '0');
  -- ⚠️⚠️ 0071 — `by_user` 를 같이 담습니다. 로그인하셨으면 승인하는 그
  --   자리에서 담당자로 이어 드릴 수 있고(초대 코드가 필요 없습니다),
  --   비로그인이면 null 이라 초대 코드 길로 갑니다.
  --   ⚠️ 화면이 보낸 값을 안 믿습니다 — `auth.uid()` 를 씁니다.
  insert into provider_apply
    (no, company, brn, name, tel, email, region, addr, services, note, agree_at, by_user)
  values
    (v_no, v_company, v_brn, v_name, v_tel, v_email, v_region, v_addr, v_svc, v_note,
     (p->>'agree_at')::timestamptz, auth.uid());
  -- ⚠️ 감사 기록에 **성함 · 연락처를 넣지 않습니다.** audit_log 는 오래
  --    남고 보는 사람도 넓습니다. 신청번호로 찾아가면 됩니다.
  insert into audit_log (by_user, by_role, obj, obj_id, to_state, why, data)
  values (auth.uid(), my_role(), 'provider_apply', v_no, 'new', '입점 신청 접수',
          jsonb_build_object('services', v_svc, 'region', v_region,
                             'signed_in', (auth.uid() is not null)));
  return v_no;
end $$;
revoke all on function make_apply(jsonb) from public;
grant execute on function make_apply(jsonb) to anon, authenticated;
create or replace function link_apply_account(p jsonb)
  returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_me   uuid     := auth.uid();
  v_role app_role := my_role();
  v_no   text     := btrim(coalesce(p->>'no', ''));
  v_why  text     := nullif(btrim(coalesce(p->>'why', '')), '');
  r      provider_apply%rowtype;
  v_cur  text;
  v_crole app_role;
begin
  if v_me is null then raise exception '변경자를 알 수 없습니다'; end if;
  -- ⚠️ coalesce 로 NULL 을 땅에 내려놓습니다 — my_role() 이 NULL 이면
  --    not (NULL) 이 NULL 이라 if 가 **안 걸립니다** (0034 에서 겪었습니다).
  if not coalesce(v_role in ('staff','admin'), false) then
    raise exception '담당자 연결은 운영자만 할 수 있습니다';
  end if;
  if v_no = '' then raise exception '어느 신청인지 접수번호를 적어 주세요'; end if;
  if v_why is null then raise exception '연결하시는 까닭을 적어 주세요'; end if;
  select * into r from provider_apply where no = v_no;
  if not found then raise exception '그런 신청이 없습니다 — %', v_no; end if;
  -- ⚠️ 자물쇠마다 **다른 말**로 거절합니다
  if r.by_user is null then
    raise exception '로그인하지 않고 넣으신 신청입니다 — 초대 코드를 내 주세요';
  end if;
  if r.provider_id is null then
    raise exception '아직 업체로 등록되지 않은 신청입니다 — 먼저 업체로 등록해 주세요';
  end if;
  if not exists (select 1 from provider where id = r.provider_id) then
    raise exception '그 신청이 가리키는 업체를 찾을 수 없습니다';
  end if;
  select provider_id, role into v_cur, v_crole from account where id = r.by_user;
  if not found then
    raise exception '신청하신 분의 계정을 찾을 수 없습니다';
  end if;
  if coalesce(v_crole in ('staff','admin'), false) then
    raise exception '운영자 계정은 업체 담당자로 이을 수 없습니다';
  end if;
  if v_cur is not null and v_cur = r.provider_id then
    raise exception '이미 그 업체의 담당자입니다';
  end if;
  if v_cur is not null then
    raise exception '그분은 다른 업체에 이어져 있습니다 — 먼저 끊어 주세요';
  end if;
  update account
     set provider_id = r.provider_id,
         role        = 'provider'
   where id = r.by_user;
  -- ⚠️ 기록에 **성함 · 연락처를 넣지 않습니다** — 접수번호와 업체 id 로
  --   찾아가면 됩니다(audit_log 는 오래 남고 보는 사람도 넓습니다).
  insert into audit_log (by_user, by_role, obj, obj_id, to_state, why, data)
  values (v_me, v_role, 'provider', r.provider_id, 'staff-linked', v_why,
          jsonb_build_object('apply_no', r.no, 'via', 'apply'));
  return jsonb_build_object('provider', r.provider_id, 'apply', r.no);
end $$;
revoke all on function link_apply_account(jsonb) from public;
grant execute on function link_apply_account(jsonb) to authenticated;
alter table provider
  add column if not exists kind text
    constraint provider_kind_ck check (kind is null or kind in ('biz','person'));
create or replace function set_provider_kind(p jsonb)
  returns void language plpgsql security definer set search_path = public as $$
declare
  v_me   uuid     := auth.uid();
  v_role app_role := my_role();
  v_id   text     := btrim(coalesce(p->>'id', ''));
  v_kind text     := nullif(btrim(coalesce(p->>'kind', '')), '');
  v_why  text     := nullif(btrim(coalesce(p->>'why', '')), '');
  v_was  text;
begin
  if v_me is null then raise exception '변경자를 알 수 없습니다'; end if;
  if not coalesce(v_role = 'admin', false) then
    raise exception '개인 · 사업자 구분은 관리자만 정할 수 있습니다';
  end if;
  if v_id = '' then raise exception '어느 업체인지 적어 주세요'; end if;
  if v_why is null then raise exception '정하시는 까닭을 적어 주세요'; end if;
  if v_kind is not null and v_kind not in ('biz','person') then
    raise exception '구분은 사업자 · 개인 둘 중 하나입니다 — %', v_kind;
  end if;
  select kind into v_was from provider where id = v_id;
  if not found then raise exception '그런 업체가 없습니다 — %', v_id; end if;
  -- ⚠️ 같은 값으로 옮기는 것은 거절합니다 — 조용히 성공하면 화면이
  --   "바꿨습니다" 를 적는데 아무 일도 안 일어났고, 기록만 거짓이 됩니다
  --   (0054 · 0069 에서 세운 규칙).
  if v_was is not distinct from v_kind then
    raise exception '이미 그 값입니다';
  end if;
  update provider set kind = v_kind where id = v_id;
  insert into audit_log (by_user, by_role, obj, obj_id, to_state, why, data)
  values (v_me, v_role, 'provider', v_id,
          coalesce('kind:' || v_kind, 'kind:none'), v_why,
          jsonb_build_object('was', v_was));
end $$;
revoke all on function set_provider_kind(jsonb) from public;
grant execute on function set_provider_kind(jsonb) to authenticated;
alter table provider
  add column if not exists place_name text
    constraint provider_place_ck check (place_name is null or length(place_name) <= 80);
alter table provider
  add column if not exists lesson_goals text[] not null default '{}';
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
  v_place text    := nullif(btrim(coalesce(p_data->>'placeName','')), '');
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
  -- ⚠️ 0071 — 레슨 장소. 표의 check 와 **다른 말**로 거절합니다.
  if v_place is not null and length(v_place) > 80 then
    raise exception '레슨 장소 이름이 너무 깁니다 (여든 자까지)';
  end if;
  -- ⚠️⚠️ 레슨 목적은 **키를 안 봅니다**(DB 가 키 묶음을 모릅니다) — 갯수와
  --   길이만 막습니다. 모르는 키가 들어오면 화면이 **그 글자를 그대로**
  --   보여 줍니다(이름을 지어내지 않습니다).
  if (select count(*) from jsonb_array_elements_text(
        case when jsonb_typeof(p_data->'lessonGoals') = 'array'
             then p_data->'lessonGoals' else '[]'::jsonb end)) > 12 then
    raise exception '레슨 목적은 열두 개까지 고르실 수 있습니다';
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
             then p_data->'contactWays' else '[]'::jsonb end) x), '{}'),
    place_name = v_place,
    lesson_goals = coalesce((select array_agg(btrim(x))
      from jsonb_array_elements_text(
        case when jsonb_typeof(p_data->'lessonGoals') = 'array'
             then p_data->'lessonGoals' else '[]'::jsonb end) x
      where btrim(x) <> ''), '{}')
  where id = v_pv;
  insert into audit_log (by_user, by_role, obj, obj_id, to_state, why, data)
  values (v_me, v_role, 'provider', v_pv, 'self-updated', p_why, p_data);
  return v_pv;
end $$;
revoke all on function save_provider_self(jsonb, text) from public;
grant execute on function save_provider_self(jsonb, text) to authenticated;
drop view if exists v_provider_card;
create view v_provider_card as
  select p.id, p.name, p.intro, p.regions, p.gu, p.subs, p.since,
         p.consult_hours, p.verified, p.brands, p.scale, p.contact_ways,
         p.ceo, p.addr, p.tel, p.email, p.brn,
         p.kind, p.place_name, p.lesson_goals,
         p.is_test
    from provider p
   where p.listed = true
     and p.is_test = false
     and p.state = 'approved';
grant select on v_provider_card to anon, authenticated;
insert into schema_version (n, name) values (71, '0071_pro_self')
  on conflict (n) do nothing;
commit;
select max(n) as ver from schema_version;
