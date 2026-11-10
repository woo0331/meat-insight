-- ════════════════════════════════════════════════════════════════════
-- 0071 — 프로가 직접 등록하고 운영자는 한 번만 (레슨 지시서 ③단계)
--        + 개인과 사업자를 구분해 표시 (전자상거래법 제20조의4 ③)
--
-- ⚠️⚠️⚠️ **왜 필요한가 — 프로 한 분당 사장님이 네 번 손을 댔습니다.**
--   ① 프로가 `/join` 신청        ② 운영자가 심사(set_apply_state)
--   ③ 운영자가 업체 등록(save_provider)  ④ 운영자가 승인(approve_provider)
--   ⑤ 운영자가 **초대 코드**를 냄(make_provider_invite)
--   ⑥ 그 코드를 **전화 · 메일로 전해** 주어야 함
--   ⑦ 프로가 `/desk` 에서 코드를 넣음(redeem_provider_invite)
--   ②③④ 는 `/admin` 한 화면이라 괜찮습니다. 참 아픈 곳은 **⑤⑥⑦** 이고,
--   거기에 사람이 전화를 걸어야 하는 **저장소 밖의 걸음**이 끼어 있습니다.
--
--   ⚠️ 못 한 까닭은 하나였습니다 — **`provider_apply` 에 "누가 신청했나"
--   칸이 없었습니다.** 그러니 승인해도 그 계정을 찾을 길이 없었습니다.
--   0071 이 그 칸(`by_user`)을 더하고, 운영자가 승인 그 자리에서 **신청한
--   그 계정만** 담당자로 잇는 문을 냅니다.
--
-- ⚠️⚠️⚠️ **역할을 올리는 길이 둘이 됩니다 — 그래서 좁게 엽니다.**
--   0043 머리말이 "역할을 올리는 유일한 길" 이라고 적어 둔 그 자리입니다.
--   새 문은 ① 운영자만 ② **그 신청에 담긴 그 계정만**(화면이 보낸 uuid 를
--   믿지 않습니다) ③ 등록이 끝난 신청만 ④ 까닭을 받고 ⑤ 감사 기록에
--   남깁니다. 초대 코드 길(0043)은 **그대로 둡니다** — 비로그인으로
--   신청하신 분은 `by_user` 가 비어 그 길로 가야 합니다(막다른 길로 두지
--   않습니다).
--
-- ⚠️⚠️⚠️ **개인과 사업자를 구분해 표시해야 합니다** (제20조의4 ③).
--   레슨 프로는 사업자등록 없이 연습장에 소속해 가르치는 분이 많습니다.
--   `/join` 이 「사업자등록 없어도 신청하실 수 있습니다」 로 문을 여는
--   순간, 손님 화면에는 **개인 판매자와 사업자가 섞입니다.** 그때 법은
--   구분해 표시하라고 합니다 — 그래서 `provider.kind` 를 둡니다.
--   ⚠️ **기본이 null 입니다**(모르는 것을 지어내지 않습니다). null 이면
--   화면은 **아무 딱지도 안 찍습니다**(절대 규칙 1 · 2). 이미 올라와 있는
--   업체를 '사업자' 로 일괄 채우지 않습니다 — 확인한 사람이 켭니다.
--   ⚠️ `brn` 이 비었다고 '개인' 으로 읽으면 안 됩니다 — 사업자인데 번호를
--   아직 안 적은 업체가 **개인으로 찍힙니다**(우리가 만든 평가입니다).
--
-- ⚠️⚠️ **덮는 짝이 셋 늘어납니다** — `check-chains` 가 CLAUDE.md 와
--   맞춰 보므로 그 목록도 같이 고쳤습니다:
--     make_apply          0027 → 0045 → **0071**
--     save_provider_self  0014 → 0023 → 0044 → 0057 → **0071**
--     v_provider_card 보기 0032 → 0038 → 0044 → 0057 → **0071**
--
-- 되돌아갔는지 보는 법:
--   select count(*) from information_schema.columns
--    where table_name = 'provider_apply' and column_name = 'by_user';   -- 1
--   select count(*) from information_schema.columns
--    where table_name = 'provider' and column_name in ('kind','place_name','lesson_goals');
--                                                                        -- 3
--   select count(*) from information_schema.columns
--    where table_name = 'v_provider_card' and column_name = 'kind';      -- 1
-- ════════════════════════════════════════════════════════════════════

-- ════════════════════════════════════════════════════════════════════
-- ① 누가 신청했나 — 비로그인 신청은 null 입니다
-- ════════════════════════════════════════════════════════════════════
alter table provider_apply
  add column if not exists by_user uuid references auth.users(id) on delete set null;

-- ⚠️ 운영자가 "신청자를 이을 수 있는 줄" 을 찾는 자리라 인덱스를 둡니다
create index if not exists provider_apply_byuser_idx
  on provider_apply (by_user) where by_user is not null;

-- ⚠️⚠️ GRANT 를 따로 안 줍니다 — 0016 이 `grant select on provider_apply
--   to authenticated` 로 **표째** 주었으므로 새 칸이 저절로 덮입니다.
--   (칸 단위로 준 표는 안 덮입니다 — `listing` 이 0069 에서 `model` 을
--   더해 놓고 GRANT 를 빠뜨려 `/my` 가 통째로 빈 채 남은 자리입니다.)
--   읽는 사람은 운영자뿐입니다(`provider_apply_staff` 정책).


-- ════════════════════════════════════════════════════════════════════
-- ② make_apply — 로그인하셨으면 그 계정을 같이 담습니다
--    (0027 → 0045 → 0071)
--
-- ⚠️ 0045 의 몸통을 그대로 두고 **insert 에 칸 하나**만 더합니다. 다시
--   쓰면 거절하는 말 열두 가지가 미묘하게 달라지고, 그때 검사는 "거절
--   되었나" 만 보므로 **엉뚱한 까닭으로 통과**합니다.
-- ⚠️⚠️ 비로그인 신청은 그대로 받습니다(`anon` 에게 EXECUTE 가 있습니다) —
--   막으면 사업자등록증을 들고 전화만 하시려는 분이 못 들어옵니다.
-- ════════════════════════════════════════════════════════════════════
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


-- ════════════════════════════════════════════════════════════════════
-- ③ 신청한 그 계정을 담당자로 잇습니다 — 초대 코드 없이
--
-- ⚠️⚠️⚠️ **화면이 보낸 계정 uuid 를 받지 않습니다.** 신청번호만 받고,
--   이을 계정은 **그 신청 줄의 `by_user`** 에서 꺼냅니다. 받게 두면 운영자
--   화면이 뚫리는 날 아무 계정이나 업체 담당자로 올릴 수 있습니다.
-- ⚠️ 운영자 계정은 못 씁니다 (0043 §10 과 같은 규칙) — 운영자가 업체
--   담당자가 되면 그 업체 건을 스스로 배정하고 스스로 견적을 냅니다.
-- ⚠️ 이미 다른 업체에 이어진 분은 거절합니다 — 옮기려면 0052 의
--   `drop_provider_staff` 로 **먼저 끊어야** 합니다(그 문이 기록을 남깁니다).
-- ════════════════════════════════════════════════════════════════════
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


-- ════════════════════════════════════════════════════════════════════
-- ④ 개인인가 사업자인가 — 제20조의4 ③ 구분 표시
--
-- ⚠️⚠️ **기본이 null 입니다** — 확인한 사람이 켭니다. null 이면 화면은
--   아무 딱지도 안 찍습니다(모르는 것을 지어내지 않습니다).
-- ════════════════════════════════════════════════════════════════════
alter table provider
  add column if not exists kind text
    constraint provider_kind_ck check (kind is null or kind in ('biz','person'));

-- ⚠️⚠️ **관리자만**입니다(직원도 거절) — 이 딱지를 켜는 일과 사업자등록증을
--   보는 일은 **같은 서류를 보는 한 사람**이어야 합니다(0057 이 `brn` 을
--   관리자에게만 연 그 까닭). 그리고 잘못 켜면 손님 화면에 **법이 요구한
--   구분 표시가 거꾸로** 나갑니다.
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


-- ════════════════════════════════════════════════════════════════════
-- ⑤ 프로가 스스로 적는 칸 둘 — 레슨 장소 · 레슨 목적
--
-- ⚠️ 레슨 지시서가 요구한 「프로 직접 등록」의 칸들 가운데 **없던 것만**
--   더합니다. 이미 있던 것 —
--     소개            provider.intro        (0001)
--     레슨 상품 · 가격 provider_price        (0042 · 한 프로가 여러 줄)
--     프로필 사진      provider_photo        (0051 · kind='photo' · 10장)
--     자격증 · 증빙    provider_photo        (0051 · kind='doc' · 비공개 5장)
--     상담 가능 시간   provider.consult_hours (0001)
--     지역             provider.regions · gu (0001)
--   ⚠️ **소개 영상은 안 만들었습니다** — 바깥 주소를 받으면 ① 꼴을 가리는
--   check 가 또 필요하고 ② 손님이 그 링크로 나가며 ③ 영상에 상표가 들어
--   있으면 제휴 · 보증으로 읽힙니다(분류 사진에서 겪은 자리). 지금 레슨
--   프로가 0분이라 급한 칸이 아니고, 필요해지는 날 따로 번호를 받습니다.
-- ════════════════════════════════════════════════════════════════════
alter table provider
  add column if not exists place_name text
    constraint provider_place_ck check (place_name is null or length(place_name) <= 80);

-- ⚠️⚠️ **키를 DB 에 박지 않습니다** — 글자 배열입니다. 박아 두면 목적이
--   늘어나는 날 화면과 DB 두 곳이 어긋나고, 그때 화면은 보내는데 DB 가
--   거절합니다(0056 의 `listing.sub` · 0061 의 `wanted.region` 과 같은
--   규칙). 목록을 쥐는 자리는 `js/data/lesson.js` 의 `AM_LESSON_GOAL`
--   **한 곳**입니다.
alter table provider
  add column if not exists lesson_goals text[] not null default '{}';


-- ════════════════════════════════════════════════════════════════════
-- ⑥ save_provider_self — 그 둘을 같이 덮습니다
--    (0014 → 0023 → 0044 → 0057 → 0071)
--
-- ⚠️⚠️⚠️ **이 문은 보낸 것으로 통째로 덮어씁니다.** 화면이 칸을 빠뜨리면
--   그 칸이 **지워집니다** — `js/deskme.js` 가 `industries` 를 안 보내서
--   저장할 때마다 비워지고 있던 자리입니다(2026-11-05). 그래서 칸을
--   더하는 날 `js/deskme.js` 도 **같이** 고쳐야 하고, `test-desk` 가 이
--   `update provider set` 블록을 **읽어서** 칸을 셉니다(검사에 칸 이름을
--   손으로 적으면 문에 칸이 붙는 날 그 칸만 조용히 지워집니다).
-- ════════════════════════════════════════════════════════════════════
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


-- ════════════════════════════════════════════════════════════════════
-- ⑦ 공개 카드 보기 — 칸 셋이 늘어납니다
--    (0032 → 0038 → 0044 → 0057 → 0071)
--
-- ⚠️⚠️⚠️ **`create or replace view` 는 칸을 못 늘립니다.** 0044 가 그렇게
--   했다가, 붙여넣기 파일을 **두 번째로** 붙여 넣을 때 앞 번호가
--   `cannot drop columns from view` 로 멈췄습니다. 그래서 `drop` + `create`
--   이고 **GRANT 를 바로 다시** 줍니다(지우면 권한도 같이 날아가서, 안
--   주면 그날부터 `pull-providers` 가 permission denied 입니다).
-- ⚠️⚠️ 보기는 RLS 를 지나지 않습니다 — **이 `where` 절이 자물쇠 그
--   자체**입니다. 조건 셋(공개 · 검사용 아님 · 승인됨)을 그대로 둡니다.
-- ════════════════════════════════════════════════════════════════════
drop view if exists v_provider_card;
create view v_provider_card as
  select p.id, p.name, p.intro, p.regions, p.gu, p.subs, p.since,
         p.consult_hours, p.verified, p.brands, p.scale, p.contact_ways,
         -- ⚠️ 0057 이 더한 다섯 (제20조 제2항 · 시행령 제25조)
         p.ceo, p.addr, p.tel, p.email, p.brn,
         -- ⚠️⚠️ 0071 이 더한 셋 — `kind` 는 제20조의4 ③ 의 구분 표시이고
         --   **null 이면 화면이 아무 딱지도 안 찍습니다**(지어내지 않습니다).
         p.kind, p.place_name, p.lesson_goals,
         p.is_test
    from provider p
   where p.listed = true
     and p.is_test = false
     and p.state = 'approved';

grant select on v_provider_card to anon, authenticated;

insert into schema_version (n, name) values (71, '0071_pro_self')
  on conflict (n) do nothing;
