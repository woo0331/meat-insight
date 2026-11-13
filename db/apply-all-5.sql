/* ==================================================================
   0071 ~ 0081 를 한 번에 —
   Supabase SQL 편집기에 **이 파일을 통째로** 붙여 넣고 Run 하세요.
   ==================================================================
   WARN 빌드가 만드는 파일입니다 — 손으로 고치지 마세요.
   db/migrations 의 11개를 번호 차례로 이어 붙인 것이고
   한 글자도 바꾸지 않았습니다. (node tools/make-apply.js)

   조각 파일입니다 — 바로 앞 조각까지 끝낸 DB 에만 쓰세요.
   어디까지 됐는지는 db/resume.sql 이 말해 줍니다
   (select max(n) from schema_version).

   돌린 뒤에는 db/verify.sql 을 붙여 넣어 보세요. 중간에서 멈추면 그
   파일 하나만 따로 돌리고 그 다음부터 이어 가시면 됩니다 — 번호를
   다시 쓰지 않습니다.

   WARN 통째로 begin/commit 으로 감싸지 마세요 — 파일마다 제
   트랜잭션이 있고 0015 는 일부러 감싸지 않았습니다. */

/* ---------------------------- 0071_pro_self.sql ---------------------------- */
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

/* ---------------------------- 0072_job_fields.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
-- 0072 — 골프 인력 · 비즈니스: 시설 · 장비 거래 갈래와 거르개 칸 넷
--        (2026-11-12 · 확정 시안 ⑨)
--
-- 시안이 탭 **넷**(채용 · 구직 · 업체 제휴 · 시설 · 장비 거래)과 좌측
-- 상세 필터(직무 · 역할 / 고용 형태 / 급여 조건)를 요구합니다. 0048 은
-- 갈래가 **셋**이고 급여가 **자유 글자**(pay)뿐이라 숫자로 못 거릅니다.
--
-- ⚠️⚠️ **전부 더하기만 합니다.** 새 칸은 모두 null 을 받아들이므로
--   이미 올라온 글은 한 줄도 안 깨집니다. pay(자유 글자)도 **그대로
--   둡니다** — 지우면 이미 "월 300만원 협의" 를 적어 둔 글이 그 말을
--   잃습니다.
--
-- ⚠️⚠️⚠️ **jobpost 는 칸 단위 GRANT 입니다** (0048 ④ — 연락처 ·
--   동의 시각을 빼려고). 칸 단위 GRANT 는 **나중에 생긴 칸을 저절로
--   덮지 않습니다.** 안 주면 0줄이 아니라 **질의가 통째로 거절**되어
--   /my 의 내 공고 상자가 빈 채로 남습니다 — 0069 가 model 을 더해
--   놓고 GRANT 를 안 줘서 0070 이 고친 바로 그 자리입니다.
--
-- ⚠️ 되돌아갔는지 보는 법:
--     select kind, count(*) from jobpost group by kind;          -- facility 가 들어가나
--     select column_name from information_schema.column_privileges
--      where table_name = 'jobpost' and grantee = 'authenticated';
-- ════════════════════════════════════════════════════════════════════

-- ════════════════════════════════════════════════════════════════════
-- ① kind 에 facility 를 더합니다
--   ⚠️⚠️⚠️ **제약 이름을 글자로 박지 않습니다.** 0048 은 칸 안에 그냥
--     check (kind in (...)) 로 적어 이름을 Postgres 가 지어 줍니다.
--     이름을 찍어 drop 하면 **다른 날 옛 제약이 그대로 남고** add 는
--     성공합니다 — 그러면 새 갈래를 옛 제약이 거절하는데 에러는 문
--     안에서 조용히 나고 화면에는 "올릴 수 없습니다" 만 보입니다
--     (0053 의 notice.kind · 0069 의 listing.state 와 같은 자리).
-- ════════════════════════════════════════════════════════════════════
do $$
declare r record;
begin
  for r in
    select con.conname
      from pg_constraint con
      join pg_class     c on c.oid = con.conrelid
      join pg_attribute a on a.attrelid = c.oid
                         and a.attnum = any(con.conkey)
     where c.relname = 'jobpost'
       and con.contype = 'c'
       and a.attname = 'kind'
  loop
    execute format('alter table jobpost drop constraint %I', r.conname);
  end loop;
end $$;

alter table jobpost
  add constraint jobpost_kind_ck
  check (kind in ('hire','seek','biz','facility'));

-- ════════════════════════════════════════════════════════════════════
-- ② 거르개가 읽을 칸 넷 — 전부 선택입니다
--
--   role      직무 · 역할   (레슨 프로 · 운영 매니저 · 피팅 장비 …)
--   emp_type  고용 형태     (정규직 · 계약직 · 프리랜서 …)
--   pay_type  금액의 갈래   (아래 여섯)
--   pay_min   그 갈래의 하한 (원) — 거르개가 **숫자로** 견줍니다
--
--   ⚠️⚠️ **role · emp_type 의 키 묶음을 DB 가 모릅니다** — 목록은
--     js/data/deal.js 한 곳이고 여기서는 빈 글자만 막습니다. 박아 두면
--     늘어나는 날 두 곳이 어긋나고, 그때 화면은 보내는데 DB 가
--     거절합니다 (0056 이 listing.sub 를 일부러 안 박은 그 까닭).
--
--   ⚠️⚠️ **pay_type 은 반대로 박습니다** — 이것은 목록이 아니라 **뜻**
--     입니다. 오타가 들어오면 거르개가 조용히 엉뚱한 글을 모읍니다
--     (에러가 안 납니다). 갈래를 늘리려면 마이그레이션이 필요한 것이
--     맞습니다.
--
--   ⚠️ 시설 · 장비 거래에는 급여가 없습니다 — 그 갈래는 pay_type 을
--     'price'(거래 희망가)로 씁니다. 칸을 따로 만들면 같은 뜻의 숫자가
--     두 칸이 되고, 거르개가 어느 칸을 봐야 할지 갈립니다.
-- ════════════════════════════════════════════════════════════════════
alter table jobpost add column if not exists role     text;
alter table jobpost add column if not exists emp_type text;
alter table jobpost add column if not exists pay_type text;
alter table jobpost add column if not exists pay_min  bigint;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'jobpost_role_ck') then
    alter table jobpost add constraint jobpost_role_ck
      check (role is null or (btrim(role) <> '' and char_length(role) <= 40));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'jobpost_emp_ck') then
    alter table jobpost add constraint jobpost_emp_ck
      check (emp_type is null or (btrim(emp_type) <> '' and char_length(emp_type) <= 40));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'jobpost_paytype_ck') then
    alter table jobpost add constraint jobpost_paytype_ck
      check (pay_type is null or pay_type in
             ('negotiate','monthly','annual','hourly','per_round','price'));
  end if;
  -- ⚠️⚠️ 경계값 — **0 원도 값입니다**(무료로 드리는 시설 · 장비).
  --   위는 100억에서 막습니다: 그 위는 사람이 자릿수를 잘못 적은
  --   것입니다 (99.99% 에서 85조원이 화면에 나간 그 자리 · 작업 기억).
  if not exists (select 1 from pg_constraint where conname = 'jobpost_paymin_ck') then
    alter table jobpost add constraint jobpost_paymin_ck
      check (pay_min is null or (pay_min >= 0 and pay_min <= 10000000000));
  end if;
  -- ⚠️⚠️ 숫자를 적었으면 **무엇의 숫자인지**를 같이 적어야 합니다.
  --   'negotiate'(협의)는 숫자를 들 수 없습니다 — 협의인데 금액이 있으면
  --   화면이 어느 쪽을 적어야 할지 알 수 없습니다.
  if not exists (select 1 from pg_constraint where conname = 'jobpost_pay_pair_ck') then
    alter table jobpost add constraint jobpost_pay_pair_ck
      check (pay_min is null
             or (pay_type is not null and pay_type <> 'negotiate'));
  end if;
end $$;

-- 거르개가 숫자로 견주는 자리 — 글이 늘면 그때 효과가 납니다
create index if not exists jobpost_filter_ix
  on jobpost (kind, region, state);

-- ════════════════════════════════════════════════════════════════════
-- ③ 칸 GRANT — ⚠️⚠️⚠️ 이 줄을 빠뜨리면 /my 의 내 공고 상자가 빈 채로
--    남습니다 (0070 의 model 자리). 안 준 칸을 부르면 **질의가 통째로
--    거절**되고 화면에는 에러도 안 납니다.
--    ⚠️ 연락처(contact) · 동의 시각(agree_at)은 **여전히 안 줍니다.**
-- ════════════════════════════════════════════════════════════════════
grant select (role, emp_type, pay_type, pay_min) on jobpost to authenticated;

-- ════════════════════════════════════════════════════════════════════
-- ④ 공개 보기에 새 칸 넷을 냅니다
--   ⚠️⚠️ **create or replace view 는 칸을 못 늘립니다** — 0044 가
--     v_provider_card 에서 밟아 사장님이 붙여넣기 파일을 두 번째로
--     붙여 넣을 때 "cannot drop columns from view" 로 멈췄습니다.
--     drop + create 로 갑니다. ⚠️ 지우면 GRANT 도 같이 날아가므로
--     **바로 다시 줍니다**(안 주면 그날부터 목록이 통째로 안 보입니다).
--   ⚠️ 체인: v_job_open 0048 → 0067 → **0072**
-- ════════════════════════════════════════════════════════════════════
drop view if exists v_job_open;
create view v_job_open as
  select j.id, j.kind, j.sub, j.region, j.title, j.body, j.pay, j.terms,
         j.role, j.emp_type, j.pay_type, j.pay_min,
         j.close_at, j.created_at, j.updated_at,
         case
           when btrim(coalesce(ac.name, '')) = '' then '회원'
           else left(btrim(ac.name), 1) ||
                repeat('*', greatest(char_length(btrim(ac.name)) - 1, 1))
         end as who,
         case when pv.id is not null and pv.state = 'approved'
                   and pv.is_test = false
              then pv.name end as pro_name,
         (select count(*) from jobapply a
           where a.post_id = j.id and a.state in ('applied','accepted')) as apply_n
    from jobpost j
    left join account  ac on ac.id = j.by_user
    left join provider pv on pv.id = j.provider_id
   where j.state = 'open'
     and (j.close_at is null or j.close_at >= kst_today());

grant select on v_job_open to anon, authenticated;

-- ════════════════════════════════════════════════════════════════════
-- ⑤ 문 — 올리기 (0048 → **0072**)
--   ⚠️ 바뀐 것: 갈래 넷 · 칸 넷을 받습니다. 나머지는 0048 그대로입니다.
--   ⚠️⚠️ **자물쇠가 둘이고 말이 다릅니다** — 문은 사람 말로, 표의
--     check 는 제약 이름으로 거절합니다. 화면에서만 막으면 꾸러미를
--     고쳐 지나갑니다.
-- ════════════════════════════════════════════════════════════════════
create or replace function open_jobpost(p jsonb)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_uid     uuid := auth.uid();
  v_kind    text := nullif(btrim(coalesce(p->>'kind','')), '');
  v_sub     text := nullif(btrim(coalesce(p->>'sub','')), '');
  v_region  text := nullif(btrim(coalesce(p->>'region','')), '');
  v_title   text := nullif(btrim(coalesce(p->>'title','')), '');
  v_body    text := nullif(btrim(coalesce(p->>'body','')), '');
  v_pay     text := nullif(btrim(coalesce(p->>'pay','')), '');
  v_terms   text := nullif(btrim(coalesce(p->>'terms','')), '');
  v_contact text := nullif(btrim(coalesce(p->>'contact','')), '');
  v_role    text := nullif(btrim(coalesce(p->>'role','')), '');
  v_emp     text := nullif(btrim(coalesce(p->>'emp_type','')), '');
  v_ptype   text := nullif(btrim(coalesce(p->>'pay_type','')), '');
  v_pmin    bigint;
  v_aspro   boolean := coalesce((p->>'as_pro')::boolean, false);
  v_close   date;
  v_pv      text;
  v_id      uuid;
begin
  if v_uid is null then
    raise exception '로그인이 필요합니다';
  end if;
  if v_kind is null or v_kind not in ('hire','seek','biz','facility') then
    raise exception '구인 · 구직 · 제휴 · 시설 · 장비 거래 가운데 하나를 골라 주세요';
  end if;
  if v_sub is null then
    raise exception '어떤 일인지 골라 주세요';
  end if;
  if char_length(v_sub) > 40 then
    raise exception '분류 값이 올바르지 않습니다';
  end if;
  if v_region is null then
    raise exception '지역을 골라 주세요';
  end if;
  if v_title is null or char_length(v_title) < 2 then
    raise exception '제목을 두 글자 이상 적어 주세요';
  end if;
  if char_length(v_title) > 60 then
    raise exception '제목이 너무 깁니다 (60자)';
  end if;
  if v_body is null or char_length(v_body) < 5 then
    raise exception '내용을 다섯 글자 이상 적어 주세요';
  end if;
  if char_length(v_body) > 2000 then
    raise exception '내용이 너무 깁니다 (2000자)';
  end if;
  if v_pay is not null and char_length(v_pay) > 60 then
    raise exception '급여 칸이 너무 깁니다 (60자)';
  end if;
  if v_terms is not null and char_length(v_terms) > 200 then
    raise exception '근무 조건이 너무 깁니다 (200자)';
  end if;
  if v_contact is null then
    raise exception '연락처를 적어 주세요';
  end if;
  if char_length(v_contact) > 100 then
    raise exception '연락처가 너무 깁니다';
  end if;

  -- ── 새 칸 넷 ────────────────────────────────────────────────────
  if v_role is not null and char_length(v_role) > 40 then
    raise exception '직무 값이 올바르지 않습니다';
  end if;
  if v_emp is not null and char_length(v_emp) > 40 then
    raise exception '고용 형태 값이 올바르지 않습니다';
  end if;
  -- ⚠️ 고용 형태는 사람을 뽑고 찾는 자리에만 있습니다. 제휴 · 시설
  --   거래에 붙으면 거르개가 그 글을 엉뚱한 칸에 모읍니다.
  if v_emp is not null and v_kind not in ('hire','seek') then
    raise exception '고용 형태는 채용 · 구직 공고에만 적을 수 있습니다';
  end if;
  if v_role is not null and v_kind = 'facility' then
    raise exception '시설 · 장비 거래에는 직무를 적지 않습니다';
  end if;
  if v_ptype is not null and v_ptype not in
     ('negotiate','monthly','annual','hourly','per_round','price') then
    raise exception '금액 갈래가 올바르지 않습니다';
  end if;
  -- ⚠️⚠️ **거래 희망가와 급여를 섞지 않습니다** — 같은 칸에 담기지만
  --   뜻이 다릅니다. 섞이면 "월 300만원 이상" 거르개가 중고 타석기
  --   300만원을 같이 끌어옵니다.
  if v_kind = 'facility' and v_ptype is not null
     and v_ptype not in ('negotiate','price') then
    raise exception '시설 · 장비 거래는 급여가 아니라 거래 희망가를 적습니다';
  end if;
  if v_kind <> 'facility' and v_ptype = 'price' then
    raise exception '거래 희망가는 시설 · 장비 거래에만 적을 수 있습니다';
  end if;
  if nullif(btrim(coalesce(p->>'pay_min','')), '') is not null then
    begin
      v_pmin := (p->>'pay_min')::bigint;
    exception when others then
      raise exception '금액은 숫자로 적어 주세요';
    end;
    if v_pmin < 0 then
      raise exception '금액은 0 이상이어야 합니다';
    end if;
    if v_pmin > 10000000000 then
      raise exception '금액이 너무 큽니다 (자릿수를 확인해 주세요)';
    end if;
    if v_ptype is null or v_ptype = 'negotiate' then
      raise exception '금액을 적으시려면 무엇의 금액인지도 골라 주세요';
    end if;
  end if;

  if p->>'agree_at' is null then
    raise exception '개인정보 수집 · 이용 동의가 필요합니다';
  end if;
  if (p->>'agree_at')::timestamptz > now() + interval '5 minutes'
     or (p->>'agree_at')::timestamptz < now() - interval '1 day' then
    raise exception '동의 시각이 올바르지 않습니다';
  end if;

  if nullif(btrim(coalesce(p->>'close_at','')), '') is not null then
    begin
      v_close := (p->>'close_at')::date;
    exception when others then
      raise exception '마감일이 올바르지 않습니다';
    end;
    if v_close < current_date then
      raise exception '지난 날짜로는 마감일을 잡을 수 없습니다';
    end if;
    if v_close > current_date + interval '365 days' then
      raise exception '마감일이 너무 멉니다 (1년 안으로)';
    end if;
  end if;

  if v_aspro then
    v_pv := my_provider();
    if v_pv is null then
      raise exception '업체 이름으로 올리려면 업체 담당자로 로그인하셔야 합니다';
    end if;
    if not coalesce((select pv.state = 'approved' and pv.is_test = false
                       from provider pv where pv.id = v_pv), false) then
      raise exception '승인된 업체만 업체 이름으로 올릴 수 있습니다';
    end if;
  end if;

  if (select count(*) from jobpost
       where by_user = v_uid and state = 'open') >= 10 then
    raise exception '올려 두신 글이 열입니다. 먼저 마감해 주세요';
  end if;
  if (select count(*) from jobpost
       where by_user = v_uid and created_at > now() - interval '1 day') >= 20 then
    raise exception '오늘은 더 올릴 수 없습니다 (하루 스무 개)';
  end if;

  insert into jobpost (by_user, provider_id, kind, sub, region, title, body,
                       pay, terms, close_at, contact, agree_at,
                       role, emp_type, pay_type, pay_min)
  values (v_uid, v_pv, v_kind, v_sub, v_region, v_title, v_body,
          v_pay, v_terms, v_close, v_contact, (p->>'agree_at')::timestamptz,
          v_role, v_emp, v_ptype, v_pmin)
  returning id into v_id;
  return v_id;
end $$;
grant execute on function open_jobpost(jsonb) to authenticated;

-- ════════════════════════════════════════════════════════════════════
-- ⑥ 문 — 고치기 (0048 → **0072**)
--   ⚠️⚠️⚠️ **새 칸 넷은 「보냈을 때만」 바뀝니다** (p ? 'role' …).
--     0048 은 제목 · 내용 · 급여 · 연락처를 **보낸 것으로 통째로**
--     덮는데, 그 방식을 새 칸에 그대로 쓰면 **이 문을 부르는 옛 화면이
--     그 칸을 조용히 지웁니다**(js/deskme.js 가 industries 를 안 보내
--     저장할 때마다 비우던 그 자리). 지시서가 "기존 데이터가 깨지지
--     않는 추가 방식" 을 요구했으므로 보냈을 때만 바꿉니다.
--     ⚠️ 그래도 **비우는 것은 보낼 수 있습니다** — null 을 실어 보내면
--     지워집니다(0069 가 model 에서 세운 규칙과 같습니다).
--   ⚠️ 갈래(kind)는 여기서 **못 바꿉니다** — 바꾸면 이미 지원하신 분이
--     다른 성격의 글에 묶입니다 (0048 이 세운 규칙 그대로).
-- ════════════════════════════════════════════════════════════════════
create or replace function edit_jobpost(p jsonb)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_uid     uuid := auth.uid();
  v_id      uuid := nullif(btrim(coalesce(p->>'id','')), '')::uuid;
  v_title   text := nullif(btrim(coalesce(p->>'title','')), '');
  v_body    text := nullif(btrim(coalesce(p->>'body','')), '');
  v_pay     text := nullif(btrim(coalesce(p->>'pay','')), '');
  v_terms   text := nullif(btrim(coalesce(p->>'terms','')), '');
  v_contact text := nullif(btrim(coalesce(p->>'contact','')), '');
  v_close   date;
  v_by      uuid;
  v_st      text;
  v_kind    text;
  v_role    text;
  v_emp     text;
  v_ptype   text;
  v_pmin    bigint;
begin
  if v_uid is null then raise exception '로그인이 필요합니다'; end if;
  if v_id is null then raise exception '어느 글인지 알 수 없습니다'; end if;
  select by_user, state, kind, role, emp_type, pay_type, pay_min
    into v_by, v_st, v_kind, v_role, v_emp, v_ptype, v_pmin
    from jobpost where id = v_id for update;
  if v_by is null then raise exception '그런 글이 없습니다'; end if;
  if not coalesce(v_by = v_uid, false) then
    raise exception '올리신 분만 고치실 수 있습니다';
  end if;
  if v_st = 'hidden' then
    raise exception '운영자가 가린 글은 고치실 수 없습니다';
  end if;
  if v_st = 'dropped' then
    raise exception '내리신 글은 고치실 수 없습니다';
  end if;

  if v_title is null or char_length(v_title) < 2 then
    raise exception '제목을 두 글자 이상 적어 주세요';
  end if;
  if char_length(v_title) > 60 then
    raise exception '제목이 너무 깁니다 (60자)';
  end if;
  if v_body is null or char_length(v_body) < 5 then
    raise exception '내용을 다섯 글자 이상 적어 주세요';
  end if;
  if char_length(v_body) > 2000 then
    raise exception '내용이 너무 깁니다 (2000자)';
  end if;
  if v_pay is not null and char_length(v_pay) > 60 then
    raise exception '급여 칸이 너무 깁니다 (60자)';
  end if;
  if v_terms is not null and char_length(v_terms) > 200 then
    raise exception '근무 조건이 너무 깁니다 (200자)';
  end if;
  if v_contact is null then
    raise exception '연락처를 적어 주세요';
  end if;
  if char_length(v_contact) > 100 then
    raise exception '연락처가 너무 깁니다';
  end if;

  -- ── 보냈을 때만 바꿉니다 ────────────────────────────────────────
  if p ? 'role' then
    v_role := nullif(btrim(coalesce(p->>'role','')), '');
  end if;
  if p ? 'emp_type' then
    v_emp := nullif(btrim(coalesce(p->>'emp_type','')), '');
  end if;
  if p ? 'pay_type' then
    v_ptype := nullif(btrim(coalesce(p->>'pay_type','')), '');
  end if;
  if p ? 'pay_min' then
    if nullif(btrim(coalesce(p->>'pay_min','')), '') is null then
      v_pmin := null;
    else
      begin
        v_pmin := (p->>'pay_min')::bigint;
      exception when others then
        raise exception '금액은 숫자로 적어 주세요';
      end;
    end if;
  end if;

  -- ⚠️ 올릴 때와 **같은 말로** 거절합니다 (두 문이 다른 말을 하면
  --   손님은 무엇이 틀렸는지 알 수 없습니다).
  if v_role is not null and char_length(v_role) > 40 then
    raise exception '직무 값이 올바르지 않습니다';
  end if;
  if v_emp is not null and char_length(v_emp) > 40 then
    raise exception '고용 형태 값이 올바르지 않습니다';
  end if;
  if v_emp is not null and v_kind not in ('hire','seek') then
    raise exception '고용 형태는 채용 · 구직 공고에만 적을 수 있습니다';
  end if;
  if v_role is not null and v_kind = 'facility' then
    raise exception '시설 · 장비 거래에는 직무를 적지 않습니다';
  end if;
  if v_ptype is not null and v_ptype not in
     ('negotiate','monthly','annual','hourly','per_round','price') then
    raise exception '금액 갈래가 올바르지 않습니다';
  end if;
  if v_kind = 'facility' and v_ptype is not null
     and v_ptype not in ('negotiate','price') then
    raise exception '시설 · 장비 거래는 급여가 아니라 거래 희망가를 적습니다';
  end if;
  if v_kind <> 'facility' and v_ptype = 'price' then
    raise exception '거래 희망가는 시설 · 장비 거래에만 적을 수 있습니다';
  end if;
  if v_pmin is not null then
    if v_pmin < 0 then
      raise exception '금액은 0 이상이어야 합니다';
    end if;
    if v_pmin > 10000000000 then
      raise exception '금액이 너무 큽니다 (자릿수를 확인해 주세요)';
    end if;
    if v_ptype is null or v_ptype = 'negotiate' then
      raise exception '금액을 적으시려면 무엇의 금액인지도 골라 주세요';
    end if;
  end if;

  if nullif(btrim(coalesce(p->>'close_at','')), '') is not null then
    begin
      v_close := (p->>'close_at')::date;
    exception when others then
      raise exception '마감일이 올바르지 않습니다';
    end;
    if v_close < current_date then
      raise exception '지난 날짜로는 마감일을 잡을 수 없습니다';
    end if;
    if v_close > current_date + interval '365 days' then
      raise exception '마감일이 너무 멉니다 (1년 안으로)';
    end if;
  end if;

  update jobpost
     set title = v_title, body = v_body, pay = v_pay, terms = v_terms,
         close_at = v_close, contact = v_contact,
         role = v_role, emp_type = v_emp,
         pay_type = v_ptype, pay_min = v_pmin,
         updated_at = now()
   where id = v_id;
  return v_id;
end $$;
grant execute on function edit_jobpost(jsonb) to authenticated;

insert into schema_version (n, name) values (72, '0072_job_fields')
  on conflict (n) do nothing;

/* ---------------------------- 0073_trip.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
-- 0073 — 골프 여행 상품 (2026-11-12 · 확정 시안 ⑧)
--
-- 시안이 상품 카드(사진 · 일정 · 1인 가격 · 포함/별도 · 판매사)와
-- 「맞춤 여행 견적」을 요구합니다. 저장소에는 **여행 상품을 담는 표가
-- 한 줄도 없었습니다** — provider_price(0042)는 값 한 줄짜리라 일정 ·
-- 포함/불포함 · 사진을 못 담습니다.
--
-- ⚠️⚠️ **여행사 표를 따로 만들지 않습니다.** 여행사 = 분류가 travel 인
--   **업체**(provider)입니다. 심사 · 승인 · 정지 · 사업자 신원정보 ·
--   공개 카드가 거기서 이미 돕니다 (0071 이 프로를 새 표로 안 만든
--   그 까닭).
--
-- ⚠️⚠️⚠️ **공개본과 수정본을 가릅니다** (2026-11-12 · 사장님 지시).
--   처음에는 "고치면 다시 심사" 로 썼는데, 그러면 **오타 하나를
--   고쳐도 팔던 상품이 목록에서 사라집니다.** 지금은 —
--     · 승인된 상품을 고치면 그 값이 `draft`(jsonb)에 들어가고
--       **공개본은 그대로 팔립니다**
--     · 운영자가 수정본을 승인하면 **그때 갈아 끼웁니다**
--     · 반려하면 **공개본이 그대로 남습니다** (수정본은 까닭과 함께
--       남아 있어 다시 고칠 수 있습니다)
--     · 여행사가 판매를 중지하면 **그 자리에서 비공개**입니다
--   ⚠️ 사진도 같은 규칙입니다 — 승인 뒤에 올린 사진은 `live = false`
--     로 들어가 **승인될 때까지 안 보이고**, 빼는 것도 그 자리에서
--     지우지 않고 `drop_pending` 으로 표시만 해 둡니다. 안 그러면
--     "공개본은 그대로" 가 글자에만 남고 사진은 바로 바뀝니다.
--
-- ⚠️ 이 파일은 **아직 어디에도 안 돌렸습니다** — 운영은 0007 기준이고
--   작업 가지에만 있습니다. 그래서 새 번호를 만들지 않고 이 파일을
--   고쳤습니다 ("번호를 다시 쓰지 않는다" 는 **이미 돌린** 파일을
--   지키는 규칙입니다).
--
-- ⚠️ 되돌아갔는지 보는 법:
--     select state, draft_state, count(*) from trip group by 1,2;
--     select count(*) from v_trip_open;        -- approved 만 세어야 합니다
--     select live, drop_pending, count(*) from tripphoto group by 1,2;
-- ════════════════════════════════════════════════════════════════════

-- ════════════════════════════════════════════════════════════════════
-- ① 상품 — 여기 적힌 값이 **공개본**입니다
-- ════════════════════════════════════════════════════════════════════
create table if not exists trip (
  id          uuid primary key default gen_random_uuid(),
  -- ⚠️ 임자는 **업체**입니다. by_user 는 누가 적었나(기록)일 뿐이고
  --   고치는 권한은 provider_id 로 가릅니다 — 담당자가 바뀌어도
  --   상품이 주인을 잃지 않습니다.
  provider_id text not null references provider(id) on delete cascade,
  by_user     uuid not null references auth.users(id) on delete cascade,
  scope       text not null check (scope in ('home','abroad')),
  -- ⚠️⚠️ **목적지 키 묶음을 DB 가 모릅니다** — 국내는 regions.js 의
  --   AM_REGIONS, 해외는 AM_TRIP_REGIONS 이고 둘 다 늘어납니다.
  dest        text not null check (btrim(dest) <> '' and char_length(dest) <= 40),
  title       text not null check (char_length(btrim(title)) between 2 and 80),
  body        text not null check (char_length(btrim(body)) between 5 and 4000),
  nights      int not null check (nights >= 0 and nights <= 60),
  days        int not null check (days   >= 1 and days   <= 61),
  constraint trip_span_ck check (days > nights),
  -- ⚠️⚠️ **1인 기준 최저가를 반드시 받습니다.** 비우면 화면이
  --   "가격 문의" 를 **지어 적게** 됩니다 (0056 이 매물 값을 반드시
  --   받는 그 까닭). 0 원은 여행 상품에 뜻이 없어 막습니다.
  price_from  bigint not null check (price_from > 0 and price_from <= 100000000),
  price_note  text check (price_note is null or char_length(price_note) <= 120),
  incl        text[] not null default '{}',
  excl        text[] not null default '{}',
  constraint trip_incl_ck check (array_length(incl,1) is null or array_length(incl,1) <= 12),
  constraint trip_excl_ck check (array_length(excl,1) is null or array_length(excl,1) <= 12),
  -- ── 상품의 상태 ────────────────────────────────────────────────
  -- pending   처음 올렸습니다 · 운영자 확인을 기다립니다 (아직 비공개)
  -- approved  승인 — **이때만** 손님 목록에 섭니다
  -- rejected  첫 심사에서 반려 ⚠️ 까닭이 반드시 있습니다 (비공개)
  -- closed    여행사가 판매를 중지했습니다 ⚠️ **그 자리에서 비공개**
  -- hidden    운영자가 가렸습니다 ⚠️ 까닭이 반드시 있습니다
  state       text not null default 'pending'
              check (state in ('pending','approved','rejected','closed','hidden')),
  -- ⚠️⚠️ 0070 의 그 자리 — 가리기 전 상태를 적어 둡니다. 안 적으면
  --   되돌릴 때 **판매 중지한 상품이 다시 파는 것처럼** 섭니다.
  hidden_from text,
  state_why   text,
  state_by    uuid references auth.users(id) on delete set null,
  state_at    timestamptz,
  -- ── 수정본 ─────────────────────────────────────────────────────
  -- ⚠️⚠️ **승인된 상품을 고치면 여기 들어갑니다.** 위의 칸들(공개본)은
  --   운영자가 수정본을 승인할 때까지 **한 글자도 안 바뀝니다.**
  --   none      고치는 중인 것이 없습니다
  --   pending   수정본이 심사를 기다립니다 (공개본은 그대로 팔립니다)
  --   rejected  수정본이 반려됐습니다 ⚠️ 공개본은 **그대로 남습니다**
  draft       jsonb,
  draft_state text not null default 'none'
              check (draft_state in ('none','pending','rejected')),
  draft_why   text,
  draft_by    uuid references auth.users(id) on delete set null,
  draft_at    timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint trip_why_ck check (
    state not in ('rejected','hidden') or btrim(coalesce(state_why,'')) <> ''),
  -- ⚠️ 수정본이 있다고 적어 두고 내용이 없으면 화면이 빈 양식을 엽니다
  constraint trip_draft_ck check (
    (draft_state = 'none') = (draft is null)),
  -- ⚠️ 반려는 까닭이 반드시 — 글쓴이가 무엇이 문제였는지 알아야 합니다
  constraint trip_draft_why_ck check (
    draft_state <> 'rejected' or btrim(coalesce(draft_why,'')) <> '')
);
create index if not exists trip_open_ix  on trip (state, scope, dest);
create index if not exists trip_pv_ix    on trip (provider_id, state);
create index if not exists trip_draft_ix on trip (draft_state);

-- ② 사진 — 0068 의 listingphoto 를 베끼되 **공개본 · 수정본**이 있습니다
create table if not exists tripphoto (
  id         uuid primary key default gen_random_uuid(),
  trip_id    uuid not null references trip(id) on delete cascade,
  by_user    uuid not null references auth.users(id) on delete cascade,
  path       text not null unique,
  mime       text not null,
  bytes      int  not null,
  caption    text,
  -- ⚠️⚠️ 대표 사진은 **ord 가 가장 앞선 것**입니다 (boolean 으로 두면
  --   둘 다 참인 줄이 생기고 화면이 멋대로 고릅니다 · 0069).
  ord        int  not null default 0,
  -- ⚠️⚠️⚠️ **승인 뒤에 올린 사진은 live = false 로 들어갑니다** —
  --   운영자가 수정본을 승인할 때 참이 됩니다. 안 그러면 "공개본은
  --   그대로" 가 글자에만 남고 사진은 그 자리에서 바뀝니다.
  live         boolean not null default true,
  -- ⚠️ 공개본의 사진을 빼는 것도 **미룹니다** — 바로 지우면 심사 전에
  --   팔던 상품의 사진이 사라집니다. 승인될 때 지웁니다.
  drop_pending boolean not null default false,
  created_at timestamptz not null default now(),
  constraint tripphoto_mime_ok  check (mime in ('image/jpeg','image/png','image/webp')),
  constraint tripphoto_bytes_ok check (bytes > 0 and bytes <= 8388608),
  constraint tripphoto_cap_ok   check (caption is null or char_length(caption) <= 60),
  constraint tripphoto_ord_ok   check (ord >= 0 and ord <= 99),
  -- ⚠️ 아직 안 보이는 사진을 "빼는 중" 으로 둘 수는 없습니다
  constraint tripphoto_drop_ok  check (not drop_pending or live),
  -- ⚠️⚠️ **경로 꼴을 표가 다시 봅니다** — 문이 지은 것만 들어갑니다.
  --   '/photo/' 가 글자로 들어가고 **서버가 그것으로 버킷을 고릅니다**
  --   (0051 이 세운 규칙 — 화면이 버킷을 고르게 두면 거기가 구멍입니다).
  constraint tripphoto_path_ok check (
    path <> '' and length(path) <= 300
    and path = 'trip/' || trip_id::text || '/photo/' || split_part(path, '/', 4))
);
create index if not exists tripphoto_ord_ix on tripphoto (trip_id, ord, created_at);

-- ③ 자물쇠 — 표에는 정책도 GRANT 도 **하나도 없습니다**.
--    읽는 길은 보기 넷, 쓰는 길은 문 아홉뿐입니다.
alter table trip      enable row level security;
alter table tripphoto enable row level security;

-- ════════════════════════════════════════════════════════════════════
-- ④ 보기 넷
-- ════════════════════════════════════════════════════════════════════
-- 손님이 보는 목록 — ⚠️ **approved 이고 · 승인된 · 검사용이 아닌 업체**
--   셋을 읽을 때 다시 봅니다 (업체가 정지되면 그 순간 빠집니다).
--   ⚠️⚠️ 수정본(draft)은 **한 글자도 안 나옵니다** — 여기 나가는 것은
--     공개본뿐입니다. 판매 중지(closed)는 state 로 바로 빠집니다.
-- ⚠️⚠️⚠️ **`create view` 만 적으면 두 번째 붙여넣기에서 멈춥니다**
--   (`relation "v_trip_open" already exists`). 사장님이 붙여넣기 파일을
--   실수로 한 번 더 돌리시면 거기서 멈추고, 그 뒤의 판이 하나도
--   안 돕니다. `test-upgrade` ⑧ 이 잡았습니다(2026-11-12).
--   ⚠️ `create or replace view` 도 안 됩니다 — 칸을 못 늘립니다(0044 의
--   그 자리). **`drop view if exists` + `create view` + GRANT 다시** 입니다.
drop view if exists v_trip_open;
create view v_trip_open as
  select t.id, t.scope, t.dest, t.title, t.body, t.nights, t.days,
         t.price_from, t.price_note, t.incl, t.excl,
         t.created_at, t.updated_at,
         pv.id   as provider_id,
         pv.name as provider_name,
         (select count(*) from tripphoto ph
           where ph.trip_id = t.id and ph.live) as photo_n,
         (select ph.path from tripphoto ph
           where ph.trip_id = t.id and ph.live
           order by ph.ord, ph.created_at, ph.id limit 1) as thumb
    from trip t
    join provider pv on pv.id = t.provider_id
   where t.state = 'approved'
     and pv.state = 'approved'
     and pv.is_test = false;
grant select on v_trip_open to anon, authenticated;

-- ⚠️ 공개로 나가는 사진은 **live 인 것만**입니다
drop view if exists v_trip_photo_public;
create view v_trip_photo_public as
  select ph.id, ph.trip_id, ph.path, ph.caption, ph.ord
    from tripphoto ph
    join trip t      on t.id = ph.trip_id
    join provider pv on pv.id = t.provider_id
   where ph.live
     and t.state = 'approved' and pv.state = 'approved' and pv.is_test = false
   order by ph.trip_id, ph.ord, ph.created_at, ph.id;
grant select on v_trip_photo_public to anon, authenticated;

-- 여행사가 제 작업실에서 보는 것 — 상태와 상관없이 **제 업체 것만**
drop view if exists v_trip_mine;
create view v_trip_mine as
  select t.*,
         (select count(*) from tripphoto ph
           where ph.trip_id = t.id and ph.live) as photo_n,
         (select count(*) from tripphoto ph
           where ph.trip_id = t.id and not ph.live) as photo_draft_n,
         (select count(*) from tripphoto ph
           where ph.trip_id = t.id and ph.drop_pending) as photo_drop_n
    from trip t
   where t.provider_id = my_provider();
grant select on v_trip_mine to authenticated;

-- 여행사가 제 사진을 보는 자리
-- ⚠️⚠️⚠️ **이 보기가 없으면 사진을 빼거나 차례를 바꿀 길이 없습니다.**
--   `drop_trip_photo` · `order_trip_photo` 는 **사진 id** 를 받는데,
--   공개 보기(`v_trip_photo_public`)는 **승인된 상품의 live 사진만**
--   냅니다 — 심사 중인 상품이나 아직 승인 안 된 사진의 id 를 여행사가
--   알 길이 없었습니다. 표에는 GRANT 도 정책도 **하나도 없습니다**
--   (공개는 보기 하나 · 쓰기는 문뿐). 문만 서 있고 **읽는 자리가 없던**
--   자리입니다 (0045 의 문의 답변 · 0013 의 연락처와 같은 꼴).
-- ⚠️ `live` · `drop_pending` 을 **그대로** 냅니다 — 화면이 "지금 보이는
--   사진" 과 "심사 중" 과 "빼는 중" 을 갈라서 말해야 합니다.
drop view if exists v_trip_photo_mine;
create view v_trip_photo_mine as
  select ph.id, ph.trip_id, ph.path, ph.caption, ph.ord,
         ph.live, ph.drop_pending, ph.created_at
    from tripphoto ph
    join trip t on t.id = ph.trip_id
   where t.provider_id = my_provider()
   order by ph.trip_id, ph.ord, ph.created_at, ph.id;
grant select on v_trip_photo_mine to authenticated;

-- 운영자가 심사하는 자리
drop view if exists v_trip_review;
create view v_trip_review as
  select t.*, pv.name as provider_name,
         (select count(*) from tripphoto ph
           where ph.trip_id = t.id and ph.live) as photo_n,
         (select count(*) from tripphoto ph
           where ph.trip_id = t.id and not ph.live) as photo_draft_n,
         (select count(*) from tripphoto ph
           where ph.trip_id = t.id and ph.drop_pending) as photo_drop_n
    from trip t
    join provider pv on pv.id = t.provider_id
   where coalesce(my_role()::text, '') in ('admin','staff');
grant select on v_trip_review to authenticated;

-- ════════════════════════════════════════════════════════════════════
-- ⑤ 값 검사 한 곳 — 올릴 때와 고칠 때가 **같은 말로** 거절합니다
--   ⚠️ 두 문에 따로 적으면 한쪽만 고치는 날 둘이 다른 것을 받습니다.
--   ⚠️⚠️ **안쪽 도움함수는 public 에게서 EXECUTE 를 거둡니다** — 함수는
--     표와 달리 만드는 순간 "누구나 실행" 입니다 (0050 에서 로그인한
--     누구나 알림을 꽂을 수 있었던 그 자리).
-- ════════════════════════════════════════════════════════════════════
create or replace function trip_fields(p jsonb)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_scope text := nullif(btrim(coalesce(p->>'scope','')), '');
  v_dest  text := nullif(btrim(coalesce(p->>'dest','')), '');
  v_title text := nullif(btrim(coalesce(p->>'title','')), '');
  v_body  text := nullif(btrim(coalesce(p->>'body','')), '');
  v_note  text := nullif(btrim(coalesce(p->>'price_note','')), '');
  v_n int; v_d int; v_price bigint;
  v_incl text[] := coalesce((select array_agg(btrim(x)) from
    jsonb_array_elements_text(case when jsonb_typeof(p->'incl') = 'array'
      then p->'incl' else '[]'::jsonb end) x where btrim(x) <> ''), '{}');
  v_excl text[] := coalesce((select array_agg(btrim(x)) from
    jsonb_array_elements_text(case when jsonb_typeof(p->'excl') = 'array'
      then p->'excl' else '[]'::jsonb end) x where btrim(x) <> ''), '{}');
begin
  if v_scope is null or v_scope not in ('home','abroad') then
    raise exception '국내 · 해외 가운데 하나를 골라 주세요';
  end if;
  if v_dest is null or char_length(v_dest) > 40 then
    raise exception '목적지를 골라 주세요';
  end if;
  if v_title is null or char_length(v_title) < 2 then
    raise exception '상품 이름을 두 글자 이상 적어 주세요';
  end if;
  if char_length(v_title) > 80 then
    raise exception '상품 이름이 너무 깁니다 (80자)';
  end if;
  if v_body is null or char_length(v_body) < 5 then
    raise exception '상품 설명을 다섯 글자 이상 적어 주세요';
  end if;
  if char_length(v_body) > 4000 then
    raise exception '상품 설명이 너무 깁니다 (4000자)';
  end if;
  begin
    v_n := coalesce((nullif(btrim(coalesce(p->>'nights','')), ''))::int, -1);
    v_d := coalesce((nullif(btrim(coalesce(p->>'days','')),   ''))::int, -1);
  exception when others then
    raise exception '일정은 숫자로 적어 주세요';
  end;
  if v_n < 0 or v_n > 60 or v_d < 1 or v_d > 61 then
    raise exception '일정이 올바르지 않습니다';
  end if;
  if v_d <= v_n then
    raise exception '일수는 박수보다 하루 많아야 합니다';
  end if;
  begin
    v_price := (nullif(btrim(coalesce(p->>'price_from','')), ''))::bigint;
  exception when others then
    raise exception '가격은 숫자로 적어 주세요';
  end;
  -- ⚠️⚠️ 비우면 화면이 "가격 문의" 를 **지어 적게** 됩니다 (절대 규칙 1)
  if v_price is null then
    raise exception '1인 기준 최저 가격을 적어 주세요';
  end if;
  if v_price <= 0 then
    raise exception '가격은 0원보다 커야 합니다';
  end if;
  if v_price > 100000000 then
    raise exception '가격이 너무 큽니다 (자릿수를 확인해 주세요)';
  end if;
  if v_note is not null and char_length(v_note) > 120 then
    raise exception '가격 안내가 너무 깁니다 (120자)';
  end if;
  if coalesce(array_length(v_incl,1),0) > 12
     or coalesce(array_length(v_excl,1),0) > 12 then
    raise exception '포함 · 불포함 항목은 각각 열둘까지입니다';
  end if;
  return jsonb_build_object(
    'scope', v_scope, 'dest', v_dest, 'title', v_title, 'body', v_body,
    'nights', v_n, 'days', v_d, 'price_from', v_price,
    'price_note', v_note, 'incl', to_jsonb(v_incl), 'excl', to_jsonb(v_excl));
end $$;
revoke all on function trip_fields(jsonb) from public;

-- 수정본을 공개본에 갈아 끼우는 자리 — ⚠️ **한 곳**입니다
create or replace function trip_apply(p_id uuid, d jsonb)
returns void
language plpgsql security definer set search_path = public as $$
begin
  update trip set
    scope = d->>'scope', dest = d->>'dest', title = d->>'title',
    body = d->>'body',
    nights = (d->>'nights')::int, days = (d->>'days')::int,
    price_from = (d->>'price_from')::bigint,
    price_note = nullif(btrim(coalesce(d->>'price_note','')), ''),
    incl = coalesce((select array_agg(x) from
      jsonb_array_elements_text(coalesce(d->'incl','[]'::jsonb)) x), '{}'),
    excl = coalesce((select array_agg(x) from
      jsonb_array_elements_text(coalesce(d->'excl','[]'::jsonb)) x), '{}'),
    updated_at = now()
  where id = p_id;
  -- 사진도 같이 갈아 끼웁니다 — 올린 것은 보이게, 뺀 것은 지웁니다
  delete from tripphoto where trip_id = p_id and drop_pending;
  update tripphoto set live = true where trip_id = p_id and not live;
  -- ⚠️⚠️ **차례도 수정본 안에 담깁니다.** 승인 뒤에 차례를 바꾸면
  --   대표 사진이 그 자리에서 바뀌는데, 그러면 "공개본은 그대로" 가
  --   거짓이 됩니다. 그래서 차례는 여기서 한꺼번에 씁니다.
  if d ? 'photo_order' then
    update tripphoto ph set ord = x.i - 1
      from (select u::uuid as id, ordinality as i
              from jsonb_array_elements_text(d->'photo_order')
                   with ordinality as t(u, ordinality)) x
     where ph.id = x.id and ph.trip_id = p_id;
  end if;
end $$;
revoke all on function trip_apply(uuid, jsonb) from public;

-- ════════════════════════════════════════════════════════════════════
-- ⑥ 문 — 여행사
-- ════════════════════════════════════════════════════════════════════
create or replace function open_trip(p jsonb)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
  v_pv text := my_provider();
  v_f  jsonb;
  v_id uuid;
begin
  if v_me is null then raise exception '로그인이 필요합니다'; end if;
  if v_pv is null then
    raise exception '여행 상품은 입점하신 업체만 올릴 수 있습니다';
  end if;
  if not coalesce((select pv.state = 'approved' and pv.is_test = false
                     from provider pv where pv.id = v_pv), false) then
    raise exception '승인된 업체만 상품을 올릴 수 있습니다';
  end if;
  v_f := trip_fields(p);
  -- ⚠️ 쏟아붓기 막기 — 심사 대기가 쌓이면 운영자가 못 봅니다
  if (select count(*) from trip
       where provider_id = v_pv and state in ('pending','approved')) >= 50 then
    raise exception '올려 두신 상품이 쉰입니다. 먼저 정리해 주세요';
  end if;
  if (select count(*) from trip
       where provider_id = v_pv and created_at > now() - interval '1 day') >= 20 then
    raise exception '오늘은 더 올릴 수 없습니다 (하루 스무 개)';
  end if;

  insert into trip (provider_id, by_user, scope, dest, title, body,
                    nights, days, price_from, price_note, incl, excl)
  values (v_pv, v_me, v_f->>'scope', v_f->>'dest', v_f->>'title', v_f->>'body',
          (v_f->>'nights')::int, (v_f->>'days')::int,
          (v_f->>'price_from')::bigint,
          nullif(btrim(coalesce(v_f->>'price_note','')), ''),
          coalesce((select array_agg(x) from jsonb_array_elements_text(v_f->'incl') x), '{}'),
          coalesce((select array_agg(x) from jsonb_array_elements_text(v_f->'excl') x), '{}'))
  returning id into v_id;

  insert into audit_log (by_user, by_role, obj, obj_id, to_state, data)
  values (v_me, my_role(), 'trip', v_id::text, 'pending',
          jsonb_build_object('provider', v_pv, 'scope', v_f->>'scope'));
  return v_id;
end $$;
revoke all on function open_trip(jsonb) from public;
grant execute on function open_trip(jsonb) to authenticated;

-- ════════════════════════════════════════════════════════════════════
-- 고치기 — ⚠️⚠️⚠️ **승인된 상품은 공개본을 안 건드립니다.**
--   아직 승인 전(pending · rejected)이면 공개된 것이 없으므로 그 자리에서
--   고치고 다시 심사로 보냅니다. 승인된 뒤에는 **수정본**으로 들어가고
--   공개본은 그대로 팔립니다.
--   ⚠️ 돌려주는 값이 '어디로 갔는지' 를 말합니다 — 화면이 "바로
--     반영되었습니다" 와 "심사 뒤에 바뀝니다" 를 갈라 적어야 합니다.
-- ════════════════════════════════════════════════════════════════════
create or replace function edit_trip(p jsonb)
returns text
language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
  v_pv text := my_provider();
  v_id uuid := nullif(btrim(coalesce(p->>'id','')), '')::uuid;
  v_owner text; v_st text;
  v_f jsonb;
begin
  if v_me is null then raise exception '로그인이 필요합니다'; end if;
  if v_id is null then raise exception '어느 상품인지 알 수 없습니다'; end if;
  select provider_id, state into v_owner, v_st from trip where id = v_id for update;
  if v_owner is null then raise exception '그런 상품이 없습니다'; end if;
  if v_pv is null or v_owner <> v_pv then
    raise exception '올리신 업체만 고치실 수 있습니다';
  end if;
  if v_st = 'hidden' then
    raise exception '운영자가 가린 상품은 고치실 수 없습니다';
  end if;
  if v_st = 'closed' then
    raise exception '판매를 중지하신 상품입니다. 먼저 다시 올려 주세요';
  end if;
  v_f := trip_fields(p);

  if v_st = 'approved' then
    -- 공개본은 그대로 — 수정본만 담습니다
    update trip set draft = v_f, draft_state = 'pending',
                    draft_why = null, draft_by = v_me, draft_at = now(),
                    updated_at = now()
     where id = v_id;
    insert into audit_log (by_user, by_role, obj, obj_id, to_state, data)
    values (v_me, my_role(), 'trip', v_id::text, 'draft_pending', '{}'::jsonb);
    return 'draft';
  end if;

  -- 아직 공개된 적이 없습니다 — 그 자리에서 고치고 다시 심사로
  perform trip_apply(v_id, v_f);
  update trip set state = 'pending', state_why = null,
                  state_by = null, state_at = null, updated_at = now()
   where id = v_id;
  insert into audit_log (by_user, by_role, obj, obj_id, to_state, data)
  values (v_me, my_role(), 'trip', v_id::text, 'pending',
          jsonb_build_object('edited', true, 'was', v_st));
  return 'pending';
end $$;
revoke all on function edit_trip(jsonb) from public;
grant execute on function edit_trip(jsonb) to authenticated;

-- 판매 중지 — ⚠️⚠️ **그 자리에서 비공개**입니다 (사장님 지시)
create or replace function close_trip(p jsonb)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
  v_pv text := my_provider();
  v_id uuid := nullif(btrim(coalesce(p->>'id','')), '')::uuid;
  v_owner text; v_st text;
begin
  if v_me is null then raise exception '로그인이 필요합니다'; end if;
  if v_id is null then raise exception '어느 상품인지 알 수 없습니다'; end if;
  select provider_id, state into v_owner, v_st from trip where id = v_id for update;
  if v_owner is null then raise exception '그런 상품이 없습니다'; end if;
  if v_pv is null or v_owner <> v_pv then
    raise exception '올리신 업체만 중지하실 수 있습니다';
  end if;
  if v_st = 'hidden' then
    raise exception '운영자가 가린 상품입니다';
  end if;
  -- ⚠️ 같은 상태로 옮기는 것은 거절합니다 — 조용히 성공하면 화면이
  --   "중지했습니다" 를 적는데 아무 일도 안 일어났습니다 (0069 의 자리).
  if v_st = 'closed' then
    raise exception '이미 판매를 중지하신 상품입니다';
  end if;
  update trip set state = 'closed', updated_at = now() where id = v_id;
  insert into audit_log (by_user, by_role, obj, obj_id, to_state, data)
  values (v_me, my_role(), 'trip', v_id::text, 'closed',
          jsonb_build_object('was', v_st));
  return v_id;
end $$;
revoke all on function close_trip(jsonb) from public;
grant execute on function close_trip(jsonb) to authenticated;

-- 다시 올리기 — ⚠️ 중지한 상품을 막다른 길로 두지 않습니다 (절대 규칙 2).
--   공개된 적이 있어도 **다시 심사**를 받습니다 (그 사이에 값이 달라졌을
--   수 있습니다).
create or replace function reopen_trip(p jsonb)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
  v_pv text := my_provider();
  v_id uuid := nullif(btrim(coalesce(p->>'id','')), '')::uuid;
  v_owner text; v_st text;
begin
  if v_me is null then raise exception '로그인이 필요합니다'; end if;
  if v_id is null then raise exception '어느 상품인지 알 수 없습니다'; end if;
  select provider_id, state into v_owner, v_st from trip where id = v_id for update;
  if v_owner is null then raise exception '그런 상품이 없습니다'; end if;
  if v_pv is null or v_owner <> v_pv then
    raise exception '올리신 업체만 다시 올리실 수 있습니다';
  end if;
  if v_st <> 'closed' then
    raise exception '판매를 중지하신 상품만 다시 올리실 수 있습니다';
  end if;
  update trip set state = 'pending', updated_at = now() where id = v_id;
  insert into audit_log (by_user, by_role, obj, obj_id, to_state, data)
  values (v_me, my_role(), 'trip', v_id::text, 'pending',
          jsonb_build_object('reopened', true));
  return v_id;
end $$;
revoke all on function reopen_trip(jsonb) from public;
grant execute on function reopen_trip(jsonb) to authenticated;

-- ⚠️⚠️⚠️ **사진만 바꾸는 것도 심사를 받아야 합니다.** 안 그러면 승인 뒤에
--   올린 사진이 draft_state 'none' 인 채로 남아 **영영 안 보입니다**
--   (운영자 화면에도 안 뜹니다 · 막다른 길). 그래서 사진 문 셋이
--   이것을 불러 수정본을 열어 둡니다 — 이때 글은 **지금 공개본 그대로**
--   담기므로 승인해도 글은 한 글자도 안 바뀝니다.
create or replace function trip_touch_draft(p_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare r trip%rowtype;
begin
  select * into r from trip where id = p_id;
  if r.id is null or r.state <> 'approved' then return; end if;
  if r.draft_state <> 'none' then return; end if;
  update trip set
    draft = jsonb_build_object(
      'scope', r.scope, 'dest', r.dest, 'title', r.title, 'body', r.body,
      'nights', r.nights, 'days', r.days, 'price_from', r.price_from,
      'price_note', r.price_note,
      'incl', to_jsonb(r.incl), 'excl', to_jsonb(r.excl)),
    draft_state = 'pending', draft_why = null,
    draft_by = auth.uid(), draft_at = now(), updated_at = now()
  where id = p_id;
end $$;
revoke all on function trip_touch_draft(uuid) from public;

-- ════════════════════════════════════════════════════════════════════
-- ⑦ 문 — 운영자
--   ⚠️⚠️ 반려 · 가리기는 **까닭이 반드시** 있습니다 (표의 check 가 다시
--     봅니다 — 자물쇠 둘이고 말이 다릅니다).
--   ⚠️⚠️⚠️ 되돌릴 때는 **가리기 전 상태로** 갑니다 (0070).
-- ════════════════════════════════════════════════════════════════════
create or replace function move_trip(p jsonb)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
  v_id uuid := nullif(btrim(coalesce(p->>'id','')), '')::uuid;
  v_to text := nullif(btrim(coalesce(p->>'to','')), '');
  v_why text := nullif(btrim(coalesce(p->>'why','')), '');
  v_st text; v_from text;
begin
  if coalesce(my_role()::text, '') not in ('admin','staff') then
    raise exception '운영자만 할 수 있습니다';
  end if;
  if v_id is null then raise exception '어느 상품인지 알 수 없습니다'; end if;
  select state, hidden_from into v_st, v_from from trip where id = v_id for update;
  if v_st is null then raise exception '그런 상품이 없습니다'; end if;
  if v_to is null or v_to not in ('approved','rejected','hidden','restore') then
    raise exception '승인 · 반려 · 가리기 · 되돌리기 가운데 하나를 골라 주세요';
  end if;
  if v_to <> 'restore' and v_to = v_st then
    raise exception '이미 그 상태입니다';
  end if;
  if v_to in ('rejected','hidden') and v_why is null then
    raise exception '까닭을 적어 주세요';
  end if;
  if v_why is not null and char_length(v_why) > 200 then
    raise exception '까닭이 너무 깁니다 (200자)';
  end if;

  if v_to = 'restore' then
    if v_st <> 'hidden' then
      raise exception '가려진 상품만 되돌릴 수 있습니다';
    end if;
    if v_from is null then
      raise exception '가리기 전 상태를 알 수 없습니다';
    end if;
    update trip set state = v_from, hidden_from = null,
                    state_why = null, state_by = v_me, state_at = now(),
                    updated_at = now()
     where id = v_id;
    insert into audit_log (by_user, by_role, obj, obj_id, to_state, data)
    values (v_me, my_role(), 'trip', v_id::text, v_from,
            jsonb_build_object('restored', true));
    return v_id;
  end if;

  update trip
     set state = v_to,
         hidden_from = case when v_to = 'hidden' then v_st else null end,
         state_why = v_why, state_by = v_me, state_at = now(),
         updated_at = now()
   where id = v_id;
  insert into audit_log (by_user, by_role, obj, obj_id, to_state, data)
  values (v_me, my_role(), 'trip', v_id::text, v_to,
          jsonb_build_object('was', v_st, 'has_why', v_why is not null));
  return v_id;
end $$;
revoke all on function move_trip(jsonb) from public;
grant execute on function move_trip(jsonb) to authenticated;

-- ════════════════════════════════════════════════════════════════════
-- 수정본 심사 — ⚠️⚠️⚠️ **반려해도 공개본은 한 글자도 안 바뀝니다.**
--   승인할 때만 갈아 끼웁니다 (글 · 사진 · 차례를 한꺼번에).
-- ════════════════════════════════════════════════════════════════════
create or replace function review_trip_draft(p jsonb)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
  v_id uuid := nullif(btrim(coalesce(p->>'id','')), '')::uuid;
  v_to text := nullif(btrim(coalesce(p->>'to','')), '');
  v_why text := nullif(btrim(coalesce(p->>'why','')), '');
  v_ds text; v_d jsonb;
begin
  if coalesce(my_role()::text, '') not in ('admin','staff') then
    raise exception '운영자만 할 수 있습니다';
  end if;
  if v_id is null then raise exception '어느 상품인지 알 수 없습니다'; end if;
  select draft_state, draft into v_ds, v_d from trip where id = v_id for update;
  if v_ds is null then raise exception '그런 상품이 없습니다'; end if;
  if v_ds = 'none' or v_d is null then
    raise exception '심사할 수정본이 없습니다';
  end if;
  if v_to is null or v_to not in ('approved','rejected') then
    raise exception '승인 · 반려 가운데 하나를 골라 주세요';
  end if;
  if v_to = 'rejected' and v_why is null then
    raise exception '까닭을 적어 주세요';
  end if;
  if v_why is not null and char_length(v_why) > 200 then
    raise exception '까닭이 너무 깁니다 (200자)';
  end if;

  if v_to = 'approved' then
    perform trip_apply(v_id, v_d);
    update trip set draft = null, draft_state = 'none', draft_why = null,
                    draft_by = v_me, draft_at = now(), updated_at = now()
     where id = v_id;
  else
    -- ⚠️ 수정본을 **지우지 않습니다** — 여행사가 그것을 고쳐 다시 냅니다
    update trip set draft_state = 'rejected', draft_why = v_why,
                    draft_by = v_me, draft_at = now(), updated_at = now()
     where id = v_id;
  end if;

  insert into audit_log (by_user, by_role, obj, obj_id, to_state, data)
  values (v_me, my_role(), 'trip', v_id::text, 'draft_' || v_to,
          jsonb_build_object('has_why', v_why is not null));
  return v_id;
end $$;
revoke all on function review_trip_draft(jsonb) from public;
grant execute on function review_trip_draft(jsonb) to authenticated;

-- ════════════════════════════════════════════════════════════════════
-- ⑧ 사진 — 0068 · 0069 를 베끼되 **승인 뒤에는 미뤄 둡니다**
--   ⚠️⚠️⚠️ **경로는 문이 짓고 버킷은 서버가 고릅니다** (0051 의 규칙).
--   ⚠️ 열 장 · 한 장에 8MB — 그 수는 여기와 화면 **두 곳**이고,
--     화면이 먼저 막아도 **DB 가 다시 봅니다**.
--   ⚠️ 세는 것은 **승인 뒤에 남을 장수**입니다 (보이는 것 − 뺄 것 + 새것).
-- ════════════════════════════════════════════════════════════════════
create or replace function claim_trip_photo(p jsonb default '{}'::jsonb)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
  v_pv text := my_provider();
  v_t  uuid := nullif(btrim(coalesce(p->>'trip','')), '')::uuid;
  v_mime text := lower(btrim(coalesce(p->>'mime','')));
  v_bytes int := coalesce((nullif(btrim(coalesce(p->>'bytes','')), ''))::int, 0);
  v_cap text := nullif(btrim(coalesce(p->>'caption','')), '');
  v_st text; v_ext text; v_path text; v_id uuid; v_ord int; v_after int;
begin
  if v_me is null then raise exception '로그인하셔야 사진을 올릴 수 있습니다'; end if;
  if v_t is null then raise exception '어느 상품인지 알 수 없습니다'; end if;
  select state into v_st from trip
   where id = v_t and v_pv is not null and provider_id = v_pv;
  if v_st is null or v_st in ('closed','hidden') then
    raise exception '그 상품에는 사진을 붙일 수 없습니다';
  end if;
  if v_mime not in ('image/jpeg','image/png','image/webp') then
    raise exception '사진은 JPG · PNG · WEBP 만 올리실 수 있습니다';
  end if;
  if v_bytes <= 0 or v_bytes > 8388608 then
    raise exception '한 장에 8MB 까지 올리실 수 있습니다';
  end if;
  if v_cap is not null and char_length(v_cap) > 60 then
    raise exception '사진 설명이 너무 깁니다 (60자)';
  end if;
  select count(*) into v_after from tripphoto
   where trip_id = v_t and not drop_pending;
  if v_after >= 10 then
    raise exception '사진은 열 장까지입니다. 먼저 빼 주세요';
  end if;

  select coalesce(max(ord), -1) + 1 into v_ord from tripphoto where trip_id = v_t;
  if v_ord > 99 then v_ord := 99; end if;
  v_ext := case v_mime when 'image/jpeg' then 'jpg'
                       when 'image/png'  then 'png' else 'webp' end;
  v_path := 'trip/' || v_t::text || '/photo/' || gen_random_uuid()::text || '.' || v_ext;

  insert into tripphoto (trip_id, by_user, path, mime, bytes, caption, ord, live)
  values (v_t, v_me, v_path, v_mime, v_bytes, v_cap, v_ord, v_st <> 'approved')
  returning id into v_id;
  -- 승인된 상품이면 **심사를 받아야** 보입니다 (안 열어 두면 영영 안 보입니다)
  perform trip_touch_draft(v_t);

  insert into audit_log (by_user, by_role, obj, obj_id, to_state, data)
  values (v_me, my_role(), 'tripphoto', v_id::text, 'claimed',
          jsonb_build_object('mime', v_mime, 'bytes', v_bytes,
                             'live', v_st <> 'approved'));
  return jsonb_build_object('id', v_id, 'path', v_path, 'ord', v_ord,
                            'live', v_st <> 'approved');
end $$;
revoke all on function claim_trip_photo(jsonb) from public;
grant execute on function claim_trip_photo(jsonb) to authenticated;

-- 빼기 — ⚠️ 공개본의 사진은 **그 자리에서 안 지웁니다**(승인될 때 지웁니다).
--   ⚠️ 없는 사진을 빼면 **거절**합니다 (0054 의 그 자리).
create or replace function drop_trip_photo(p jsonb)
returns text
language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
  v_pv text := my_provider();
  v_id uuid := nullif(btrim(coalesce(p->>'id','')), '')::uuid;
  v_t uuid; v_live boolean; v_drop boolean; v_st text; v_n int;
begin
  if v_me is null then raise exception '로그인이 필요합니다'; end if;
  if v_id is null then raise exception '어느 사진인지 알 수 없습니다'; end if;
  select ph.trip_id, ph.live, ph.drop_pending, t.state
    into v_t, v_live, v_drop, v_st
    from tripphoto ph join trip t on t.id = ph.trip_id
   where ph.id = v_id and v_pv is not null and t.provider_id = v_pv;
  if v_t is null then raise exception '그 사진은 뺄 수 없습니다'; end if;
  if v_drop then raise exception '이미 뺄 사진으로 표시하셨습니다'; end if;

  if v_st = 'approved' and v_live then
    update tripphoto set drop_pending = true where id = v_id;
    perform trip_touch_draft(v_t);
    insert into audit_log (by_user, by_role, obj, obj_id, to_state, data)
    values (v_me, my_role(), 'tripphoto', v_id::text, 'drop_pending', '{}'::jsonb);
    return 'pending';
  end if;

  delete from tripphoto where id = v_id;
  get diagnostics v_n = row_count;
  if v_n = 0 then raise exception '그 사진은 뺄 수 없습니다'; end if;
  insert into audit_log (by_user, by_role, obj, obj_id, to_state, data)
  values (v_me, my_role(), 'tripphoto', v_id::text, 'dropped', '{}'::jsonb);
  return 'dropped';
end $$;
revoke all on function drop_trip_photo(jsonb) from public;
grant execute on function drop_trip_photo(jsonb) to authenticated;

-- 차례 바꾸기 — ⚠️⚠️ **늘어놓은 배열을 통째로** 받고 **빠짐없이** 와야
--   합니다 (일부만 보내면 안 보낸 것이 조용히 0 이 되어 그것이 대표가
--   됩니다 · 0069). ⚠️ 승인된 상품이면 **수정본에 담기고** 심사 뒤에
--   바뀝니다 — 안 그러면 대표 사진이 그 자리에서 바뀝니다.
create or replace function order_trip_photo(p jsonb)
returns text
language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
  v_pv text := my_provider();
  v_t  uuid := nullif(btrim(coalesce(p->>'trip','')), '')::uuid;
  v_ids uuid[]; v_have int; v_i int; v_st text; v_d jsonb;
begin
  if v_me is null then raise exception '로그인이 필요합니다'; end if;
  if v_t is null then raise exception '어느 상품인지 알 수 없습니다'; end if;
  select state into v_st from trip
   where id = v_t and v_pv is not null and provider_id = v_pv;
  if v_st is null then raise exception '그 상품은 고치실 수 없습니다'; end if;
  select coalesce(array_agg(x::uuid), '{}') into v_ids
    from jsonb_array_elements_text(coalesce(p->'ids','[]'::jsonb)) x;
  select count(*) into v_have from tripphoto where trip_id = v_t;
  if coalesce(array_length(v_ids,1),0) <> v_have then
    raise exception '사진 차례는 빠짐없이 보내 주셔야 합니다';
  end if;
  if (select count(distinct u) from unnest(v_ids) u) <> v_have then
    raise exception '같은 사진이 두 번 들어 있습니다';
  end if;
  if exists (select 1 from unnest(v_ids) u
              where u not in (select id from tripphoto where trip_id = v_t)) then
    raise exception '그 상품의 사진이 아닌 것이 섞여 있습니다';
  end if;

  if v_st = 'approved' then
    perform trip_touch_draft(v_t);
    select draft into v_d from trip where id = v_t;
    update trip set draft = coalesce(v_d,'{}'::jsonb)
                      || jsonb_build_object('photo_order', to_jsonb(v_ids)),
                    updated_at = now()
     where id = v_t;
    return 'pending';
  end if;

  v_i := 0;
  while v_i < v_have loop
    update tripphoto set ord = v_i where id = v_ids[v_i + 1];
    v_i := v_i + 1;
  end loop;
  return 'done';
end $$;
revoke all on function order_trip_photo(jsonb) from public;
grant execute on function order_trip_photo(jsonb) to authenticated;

insert into schema_version (n, name) values (73, '0073_trip')
  on conflict (n) do nothing;

/* ---------------------------- 0074_range_facility.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
-- 0074 — 골프 연습장 시설 정보 (2026-11-12 · 확정 시안 ⑤)
--
-- 시안이 고르개 다섯(지역 · 실내/실외 · 스크린 · 주차 · 가격)과
-- 카드의 「1회 60분 · 15,000원 / 주차 가능 / 레슨 운영」을 요구합니다.
--
-- ⚠️⚠️⚠️ **새 표를 만들지 않습니다.** 연습장 = 분류가 range 인
--   **업체**(provider)입니다. 심사 · 승인 · 정지 · 사진 · 사업자
--   신원정보가 거기서 이미 돕니다 (0071 이 프로를 새 표로 안 만든
--   그 까닭). 칸 둘만 더합니다.
--
-- ⚠️⚠️⚠️ **가격은 칸을 안 만듭니다** — provider_price(0042)가 이미
--   "1회 60분 · 15,000원" 을 label · unit · amount 로 담고 있고,
--   화면의 `amPriceLow()` 가 그 줄에서 최저가를 셉니다. 칸을 또 만들면
--   같은 값이 두 곳이 되고 한쪽만 고치는 날 카드와 상세가 다른 값을
--   말합니다.
--
-- ⚠️⚠️ **지도는 아무것도 안 만듭니다** — 0066 이 "공공 인허가 자료는
--   좌표계가 섞여 있어 확인 전에는 비웁니다" 로 둔 자리입니다. 좌표가
--   없는데 지도를 그리면 손님을 엉뚱한 곳으로 보냅니다. 화면은 지도
--   단추를 **활성으로 내지 않습니다**(절대 규칙 5).
--
-- ⚠️ 되돌아갔는지 보는 법:
--     select column_name from information_schema.columns
--      where table_name='provider' and column_name in ('range_opts','open_hours');
--     select count(*) from information_schema.columns
--      where table_name='v_provider_card' and column_name in ('range_opts','open_hours');
-- ════════════════════════════════════════════════════════════════════

-- ════════════════════════════════════════════════════════════════════
-- ① 칸 둘 — 전부 선택이고 기본값이 있어 **기존 업체는 한 줄도 안 깨집니다**
--
--   range_opts  시설 속성 — 실내 · 실외 · 스크린 · 주차 · 레슨 운영
--   open_hours  이용 시간 — "06:00 ~ 23:00" 같은 **사실**만 적습니다
--
--   ⚠️⚠️ **키 묶음을 DB 가 모릅니다** — 목록은 js/data/providers.js
--     한 곳(AM_RANGE_OPT)이고 여기서는 **갯수와 길이만** 막습니다.
--     박아 두면 늘어나는 날 두 곳이 어긋나고, 그때 화면은 보내는데
--     DB 가 거절합니다 (0056 이 listing.sub 를 안 박은 그 까닭).
-- ════════════════════════════════════════════════════════════════════
alter table provider add column if not exists range_opts text[] not null default '{}';
alter table provider add column if not exists open_hours text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'provider_range_opts_ck') then
    alter table provider add constraint provider_range_opts_ck
      check (array_length(range_opts, 1) is null or array_length(range_opts, 1) <= 12);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'provider_open_hours_ck') then
    alter table provider add constraint provider_open_hours_ck
      check (open_hours is null or char_length(btrim(open_hours)) between 1 and 60);
  end if;
end $$;

-- ════════════════════════════════════════════════════════════════════
-- ② 공개 카드에 칸 둘을 냅니다
--   ⚠️⚠️ **create or replace view 는 칸을 못 늘립니다** — drop + create
--     이고 GRANT 를 **바로 다시** 줍니다 (지우면 같이 날아갑니다).
--   ⚠️ 체인: v_provider_card 0032 → 0038 → 0044 → 0057 → 0071 → **0074**
-- ════════════════════════════════════════════════════════════════════
drop view if exists v_provider_card;
create view v_provider_card as
  select p.id, p.name, p.intro, p.regions, p.gu, p.subs, p.since,
         p.consult_hours, p.verified, p.brands, p.scale, p.contact_ways,
         p.ceo, p.addr, p.tel, p.email, p.brn,
         p.kind, p.place_name, p.lesson_goals,
         -- ⚠️ 0074 가 더한 둘 — 연습장 거르개가 읽습니다
         p.range_opts, p.open_hours,
         p.is_test
    from provider p
   where p.listed = true
     and p.is_test = false
     and p.state = 'approved';
grant select on v_provider_card to anon, authenticated;

-- ====================================================================
-- ③ 문 — 업체가 제 정보를 고칩니다 (0014 → 0023 → 0044 → 0057 → 0071 → **0074**)
--   ⚠️⚠️⚠️ **보낸 것으로 통째로 덮습니다.** 그래서 js/deskme.js 가
--     새 칸 둘을 **읽고 또 보내야** 합니다 — 안 하면 업체가 저장할
--     때마다 그 둘이 지워집니다 (industries 로 겪은 그 자리).
--     그려지지 않는 칸은 **읽은 값을 그대로 돌려보냅니다.**
-- ====================================================================
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
  -- ⚠️ 0074 — 연습장 시설 정보 둘
  v_hours text    := nullif(btrim(coalesce(p_data->>'openHours','')), '');
  v_opts  text[]  := coalesce((select array_agg(btrim(x))
    from jsonb_array_elements_text(
      case when jsonb_typeof(p_data->'rangeOpts') = 'array'
           then p_data->'rangeOpts' else '[]'::jsonb end) x
    where btrim(x) <> ''), '{}');
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
  -- ⚠️ 0074 — 이용 시간과 시설 속성. **키 묶음은 화면이 들고 있고**
  --   여기서는 갯수와 길이만 봅니다 (박아 두면 느는 날 어긋납니다).
  if v_hours is not null and char_length(v_hours) > 60 then
    raise exception '이용 시간이 너무 깁니다 (60자)';
  end if;
  if coalesce(array_length(v_opts, 1), 0) > 12 then
    raise exception '시설 항목은 열둘까지입니다';
  end if;
  if exists (select 1 from unnest(v_opts) u where char_length(u) > 40) then
    raise exception '시설 항목 값이 올바르지 않습니다';
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
    range_opts = v_opts,
    open_hours = v_hours,
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

insert into schema_version (n, name) values (74, '0074_range_facility')
  on conflict (n) do nothing;

/* ---------------------------- 0075_cq_thumb.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
-- 0075 — 커뮤니티 목록에 **첫 사진 한 장**을 같이 냅니다
--        (2026-11-12 · 확정 시안 ⑩ 의 목록 썸네일)
--
-- 시안의 글 목록이 오른쪽에 **작은 사진**을 답니다. 지금 공개 보기는
-- `photo_n`(몇 장인지)만 내고 **어느 사진인지**를 안 내서, 화면이 글
-- 스무 줄마다 사진을 따로 물어봐야 합니다.
--
-- ⚠️⚠️ 0068 이 매물에서 세운 그 규칙입니다 — "안 내면 카드마다 사진을
--   따로 물어보게 되어 스무 장이면 호출이 스무 번 늘고, 그동안 카드가
--   비어 있어 **사진 없는 장터**로 보입니다."
--
-- ⚠️ **칸 하나만 더합니다.** 표도 문도 안 건드립니다.
-- ⚠️⚠️ **create or replace view 는 칸을 못 늘립니다** — drop + create
--   이고 GRANT 를 **바로 다시** 줍니다 (0044 가 밟은 자리).
-- ⚠️ 체인: v_cq_public 0047 → 0059 → 0063 → **0075**
--
-- ⚠️ 되돌아갔는지 보는 법:
--     select count(*) from information_schema.columns
--      where table_name = 'v_cq_public' and column_name = 'thumb';
-- ════════════════════════════════════════════════════════════════════
drop view if exists v_cq_public;
create view v_cq_public as
  select q.id, q.cat, q.title, q.body, q.created_at, q.updated_at,
         case
           when q.by_user is null then btrim(coalesce(q.guest_nick, '손님'))
           when btrim(coalesce(a.nick, '')) <> '' then btrim(a.nick)
           when btrim(coalesce(a.name, '')) = '' then '회원'
           else left(btrim(a.name), 1) ||
                repeat('*', greatest(char_length(btrim(a.name)) - 1, 1))
         end as who,
         (q.by_user is null or btrim(coalesce(a.nick, '')) <> '') as named,
         (q.by_user is null) as guest,
         coalesce(q.by_user = auth.uid(), false) as mine,
         (select count(*) from ca where ca.q_id = q.id and ca.state = 'live') as answer_n,
         (select count(*) from cqview v where v.q_id = q.id) as view_n,
         (select count(*) from cqphoto f where f.q_id = q.id) as photo_n,
         -- ⚠️⚠️ **올린 차례로 첫 장**입니다. cqphoto 에는 ord 가 없으므로
         --   created_at · id 로 가릅니다 — 두 글이 같은 순간에 올라와도
         --   id 가 갈라 주므로 **늘 같은 장**이 나옵니다(화면이 새로고침
         --   할 때마다 다른 사진을 내지 않게).
         (select f.path from cqphoto f where f.q_id = q.id
           order by f.created_at, f.id limit 1) as thumb
    from cq q
    left join account a on a.id = q.by_user
   where q.state = 'live';
grant select on v_cq_public to anon, authenticated;

insert into schema_version (n, name) values (75, '0075_cq_thumb')
  on conflict (n) do nothing;

/* ---------------------------- 0076_fitting.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
-- 0076 — 피팅 · 수리 서비스 방식 (2026-11-12 · 확정 시안 ⑦)
--
-- 시안의 왼쪽 레일이 거르개 셋을 요구합니다 — 지역 · **서비스 방식** ·
-- 가격. 지역과 가격은 이미 있는 것으로 거릅니다(`provider.regions` ·
-- `provider_price`). 없는 것은 **서비스 방식** 하나입니다.
--
-- ⚠️⚠️⚠️ **새 표를 만들지 않습니다.** 피팅 업체 = 분류가 fitting 인
--   **업체**(provider)입니다. 심사 · 승인 · 정지 · 사진 · 가격 ·
--   사업자 신원정보가 거기서 이미 돕니다 (0071 이 프로를 · 0074 가
--   연습장을 새 표로 안 만든 그 까닭). 칸 하나만 더합니다.
--
-- ⚠️⚠️⚠️ **`contact_ways`(0044)를 빌려 쓰지 않습니다.** 그 칸은
--   전화 · 방문 · 온라인 · 매장 네 가지 **상담 방식**이고, 시안이
--   말하는 것은 **이용 방식**(매장에 가져가나 · 택배로 보내나)입니다.
--   빌려 쓰면 「택배」가 갈 자리가 없어 그 칸이 반쪽 거르개가 됩니다
--   (골라도 안 걸러 주는 칸 · 절대 규칙 5).
--
-- ⚠️⚠️ **가격은 칸을 안 만듭니다** — provider_price(0042)가 이미
--   "그립 교체 공임 · 10,000원" 을 label · unit · amount 로 담습니다.
--   칸을 또 만들면 같은 값이 두 곳이 되고 한쪽만 고치는 날 카드와
--   상세가 다른 값을 말합니다 (0074 와 같은 판단).
--
-- ⚠️⚠️ **「부품비 별도」를 칸으로도 글로도 안 박습니다** — 시안의
--   그 줄은 우리가 모르는 거래 조건입니다. 업체마다 다르고 확인할
--   길이 없어, 우리가 적으면 지어낸 약속이 됩니다 (절대 규칙 1 · 5).
--   화면은 **업체가 등록한 값의 이름(label)** 을 그대로 냅니다.
--
-- ⚠️ 되돌아갔는지 보는 법:
--     select column_name from information_schema.columns
--      where table_name='provider' and column_name = 'fit_ways';
--     select count(*) from information_schema.columns
--      where table_name='v_provider_card' and column_name = 'fit_ways';
-- ════════════════════════════════════════════════════════════════════

-- ════════════════════════════════════════════════════════════════════
-- ① 칸 하나 — 선택이고 기본값이 있어 **기존 업체는 한 줄도 안 깨집니다**
--
--   fit_ways  이용 방식 — 방문(매장에 가져가기) · 택배(클럽 발송)
--
--   ⚠️⚠️ **키 묶음을 DB 가 모릅니다** — 목록은 js/data/providers.js
--     한 곳(AM_FIT_WAY)이고 여기서는 **갯수와 길이만** 막습니다.
--     박아 두면 늘어나는 날 두 곳이 어긋나고, 그때 화면은 보내는데
--     DB 가 거절합니다 (0056 이 listing.sub 를 안 박은 그 까닭).
-- ════════════════════════════════════════════════════════════════════
alter table provider add column if not exists fit_ways text[] not null default '{}';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'provider_fit_ways_ck') then
    alter table provider add constraint provider_fit_ways_ck
      check (array_length(fit_ways, 1) is null or array_length(fit_ways, 1) <= 6);
  end if;
end $$;

-- ════════════════════════════════════════════════════════════════════
-- ② 공개 카드에 그 칸을 냅니다
--   ⚠️⚠️ **create or replace view 는 칸을 못 늘립니다** — drop + create
--     이고 GRANT 를 **바로 다시** 줍니다 (지우면 같이 날아갑니다).
--   ⚠️ 체인: v_provider_card 0032 → 0038 → 0044 → 0057 → 0071 → 0074 → **0076**
-- ════════════════════════════════════════════════════════════════════
drop view if exists v_provider_card;
create view v_provider_card as
  select p.id, p.name, p.intro, p.regions, p.gu, p.subs, p.since,
         p.consult_hours, p.verified, p.brands, p.scale, p.contact_ways,
         p.ceo, p.addr, p.tel, p.email, p.brn,
         p.kind, p.place_name, p.lesson_goals,
         p.range_opts, p.open_hours,
         -- ⚠️ 0076 이 더한 것 — 피팅 거르개가 읽습니다
         p.fit_ways,
         p.is_test
    from provider p
   where p.listed = true
     and p.is_test = false
     and p.state = 'approved';
grant select on v_provider_card to anon, authenticated;

-- ====================================================================
-- ③ 문 — 업체가 제 정보를 고칩니다
--     (0014 → 0023 → 0044 → 0057 → 0071 → 0074 → **0076**)
--   ⚠️⚠️⚠️ **보낸 것으로 통째로 덮습니다.** 그래서 js/deskme.js 가
--     새 칸을 **읽고 또 보내야** 합니다 — 안 하면 업체가 저장할 때마다
--     그 칸이 비워집니다 (`industries` 로 겪은 자리).
--   ⚠️ 화면에 그 칸을 안 그리는 업체(피팅을 안 하시는 분)는 **읽은 값을
--     그대로 돌려보냅니다** — 0074 의 `optsVal()` 과 같은 자리입니다.
-- ====================================================================
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
  -- ⚠️ 0074 — 연습장 시설 정보 둘
  v_hours text    := nullif(btrim(coalesce(p_data->>'openHours','')), '');
  v_opts  text[]  := coalesce((select array_agg(btrim(x))
    from jsonb_array_elements_text(
      case when jsonb_typeof(p_data->'rangeOpts') = 'array'
           then p_data->'rangeOpts' else '[]'::jsonb end) x
    where btrim(x) <> ''), '{}');
  -- ⚠️ 0076 — 피팅 이용 방식
  v_fw    text[]  := coalesce((select array_agg(btrim(x))
    from jsonb_array_elements_text(
      case when jsonb_typeof(p_data->'fitWays') = 'array'
           then p_data->'fitWays' else '[]'::jsonb end) x
    where btrim(x) <> ''), '{}');
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
  -- ⚠️ 0074 — 이용 시간과 시설 속성. **키 묶음은 화면이 들고 있고**
  --   여기서는 갯수와 길이만 봅니다 (박아 두면 느는 날 어긋납니다).
  if v_hours is not null and char_length(v_hours) > 60 then
    raise exception '이용 시간이 너무 깁니다 (60자)';
  end if;
  if coalesce(array_length(v_opts, 1), 0) > 12 then
    raise exception '시설 항목은 열둘까지입니다';
  end if;
  if exists (select 1 from unnest(v_opts) u where char_length(u) > 40) then
    raise exception '시설 항목 값이 올바르지 않습니다';
  end if;
  -- ⚠️ 0076 — 이용 방식. 표의 check 와 **다른 말**로 거절합니다
  --   (같은 말로 거절하면 어느 자물쇠가 막았는지 알 수 없습니다).
  if coalesce(array_length(v_fw, 1), 0) > 6 then
    raise exception '이용 방식은 여섯 가지까지입니다';
  end if;
  if exists (select 1 from unnest(v_fw) u where char_length(u) > 40) then
    raise exception '이용 방식 값이 올바르지 않습니다';
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
    range_opts = v_opts,
    open_hours = v_hours,
    fit_ways = v_fw,
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

insert into schema_version (n, name) values (76, '0076_fitting')
  on conflict (n) do nothing;

/* ---------------------------- 0077_trip_depart.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
-- 0077 — 여행 상품의 **출발일 · 출발 가능 기간** (확정 시안 ⑧)
--
-- ⚠️⚠️⚠️ **0073 은 출발일을 안 받았습니다.** 그래서 시안의 「출발 월」
--   고르개를 **아예 안 냈습니다** — 고르게 해 놓고 안 걸러 주면 눌러도
--   아무 일이 안 나는 칸이니까요(절대 규칙 5). 지시가 「담는 구조가
--   없다는 것은 기능을 빼는 까닭이 아니다 · 출발 월 필터가 실제로
--   동작하게 한다」이므로 **구조를 만듭니다.**
--
-- ⚠️⚠️ **방식이 둘입니다 — 여행 상품은 둘 다 팝니다.**
--   · `dates`  확정 출발일 여러 개 (「12/5, 12/19, 1/9 출발」)
--   · `range`  출발 가능 기간     (「12월~2월 사이 원하시는 날」)
--   · `none`   아직 안 정했습니다 ⚠️ **이것을 지우지 않습니다** —
--     0073 으로 이미 올라온 상품이 전부 이 자리이고, 억지로 날짜를
--     채우면 **지어낸 일정**이 손님 화면에 나갑니다(절대 규칙 1).
--     화면이 「출발일 미등록」으로 **갈라서** 적고, 출발 월로 좁히면
--     그 상품은 빠집니다(그 사실도 그 자리에서 말합니다).
--
-- ⚠️⚠️⚠️ **출발일은 수정본(draft) 심사를 안 거칩니다.** 0073 은 승인된
--   상품을 고치면 `draft` 로 들어가 운영자가 다시 봅니다 — 제목 · 값 ·
--   포함 조건처럼 **광고 문구에 가까운 것**이 그 자리입니다. 날짜는
--   다릅니다: 한 자리 마감되면 그날 빼야 하고, 새 일정이 잡히면 그날
--   더해야 합니다. 그것을 심사에 걸면 **여행사가 못 파는 날이 생기고**,
--   그러면 화면의 출발일이 참이 아니게 됩니다. 그래서 **따로 받습니다.**
--   ⚠️ 대신 **지난 날짜는 공개 보기가 스스로 뺍니다**(아래 함수 둘) —
--   여행사가 안 지워도 어제 날짜가 손님 화면에 남지 않습니다.
--
-- ⚠️⚠️ **보기 둘을 다시 만듭니다** — `create or replace view` 는 칸을
--   못 늘립니다(0044 가 붙여넣기 두 번째에서 멈춘 그 자리). 그리고
--   `v_trip_mine` 은 `select t.*` 이라 **다시 만들지 않으면 새 칸이
--   영영 안 나옵니다**(에러 한 줄 없이). 지우면 GRANT 도 같이 날아가니
--   **바로 다시 줍니다.**
--
-- 되돌아갔는지 보는 법:
--   select depart_kind from trip limit 1;              -- 없으면 안 올라갔습니다
--   select count(*) from pg_views where viewname = 'v_trip_date_public';
-- ════════════════════════════════════════════════════════════════════
begin;

-- ① 상품에 출발 방식 ───────────────────────────────────────────────
alter table trip add column if not exists depart_kind text not null default 'none';
alter table trip add column if not exists depart_from date;
alter table trip add column if not exists depart_to   date;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'trip_depart_kind_ck') then
    alter table trip add constraint trip_depart_kind_ck
      check (depart_kind in ('dates','range','none'));
  end if;
  -- ⚠️ `range` 면 둘 다 있어야 하고, 아니면 둘 다 없어야 합니다 —
  --   한쪽만 있으면 화면이 「12월~」처럼 **반쪽 기간**을 적게 됩니다.
  if not exists (select 1 from pg_constraint where conname = 'trip_depart_span_ck') then
    alter table trip add constraint trip_depart_span_ck
      check ((depart_kind = 'range')
             = (depart_from is not null and depart_to is not null));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'trip_depart_order_ck') then
    alter table trip add constraint trip_depart_order_ck
      check (depart_from is null or depart_to is null or depart_to >= depart_from);
  end if;
end $$;

-- ② 확정 출발일 ───────────────────────────────────────────────────
-- ⚠️ 표에는 정책도 GRANT 도 **하나도 없습니다** — 공개로 읽는 길은
--   보기 하나이고, 쓰는 길은 문 하나입니다(0066 과 같은 규칙).
create table if not exists tripdate (
  trip_id   uuid not null references trip(id) on delete cascade,
  depart_on date not null,
  primary key (trip_id, depart_on)
);
alter table tripdate enable row level security;
create index if not exists tripdate_ix on tripdate (trip_id, depart_on);

-- ③ 달 목록과 가장 가까운 출발일 ──────────────────────────────────
-- ⚠️⚠️ **달을 배열로 냅니다.** 손님 화면은 `months=cs.{2026-12}` 한 줄로
--   좁힙니다 — 그래야 거르는 일을 **서버가** 합니다(쉰 줄만 받아 화면에서
--   거르면 그 쉰 줄 밖의 상품이 영영 안 나옵니다).
-- ⚠️ 지난 달은 **안 담습니다** — 오늘이 지난 출발일로 좁혀 봐야 0건이고,
--   고르개에 지난 달이 서면 그게 눌러도 아무 일이 안 나는 칸입니다.
-- ⚠️⚠️⚠️ **보기 안의 함수는 보기 임자가 아니라 「부르는 사람」 권한으로
--   돕니다.** 처음에 이 함수가 `tripdate` 를 직접 읽게 쓰고
--   `revoke all … from public` 을 걸었더니, 여행사가 `v_trip_mine` 을
--   읽는 순간 **permission denied for function trip_months** 로 질의가
--   통째로 거절됐습니다 — 보기는 표 접근만 임자 권한으로 바꿔 줍니다.
--   ⚠️ 그래서 **자료를 인자로 받는 순수 함수**로 바꿨습니다(표를 한 줄도
--   안 읽습니다). 그러면 아무에게 EXECUTE 를 줘도 **샐 것이 없습니다** —
--   받은 날짜 배열을 달로 바꿔 줄 뿐입니다. 날짜를 모으는 일은 보기가
--   **임자 권한으로** 합니다(거기가 자물쇠입니다).
create or replace function trip_months(
  p_kind text, p_from date, p_to date, p_days date[])
returns text[] language sql immutable as $$
  select case
    when p_kind = 'range' and p_to >= kst_today() then (
      select array_agg(distinct to_char(m, 'YYYY-MM') order by to_char(m, 'YYYY-MM'))
        from generate_series(
               date_trunc('month', greatest(p_from, kst_today()))::date,
               date_trunc('month', p_to)::date,
               interval '1 month') m)
    when p_kind = 'dates' then (
      select array_agg(distinct to_char(d, 'YYYY-MM') order by to_char(d, 'YYYY-MM'))
        from unnest(coalesce(p_days, '{}'::date[])) d
       where d >= kst_today())
    else null end
$$;
-- ⚠️ 표를 안 읽는 순수 함수라 EXECUTE 를 줘도 샐 것이 없습니다.
--   **보기가 부르므로 반드시 줘야 합니다**(안 주면 보기가 통째로 거절).
grant execute on function trip_months(text, date, date, date[])
  to anon, authenticated;

-- ⚠️ 위와 같은 까닭으로 **자료를 인자로** 받습니다(표를 안 읽습니다).
create or replace function trip_next_depart(
  p_kind text, p_from date, p_to date, p_days date[])
returns date language sql immutable as $$
  select case
    when p_kind = 'range' and p_to >= kst_today()
      then greatest(p_from, kst_today())
    when p_kind = 'dates' then (
      select min(d) from unnest(coalesce(p_days, '{}'::date[])) d
       where d >= kst_today())
  end
$$;
grant execute on function trip_next_depart(text, date, date, date[])
  to anon, authenticated;

-- ④ 여행사가 출발일을 정하는 문 ───────────────────────────────────
-- ⚠️⚠️ **늘어놓은 것을 통째로 받습니다**(0069 의 `order_listing_photo`
--   와 같은 꼴) — 한 날짜씩 더하고 빼게 두면 두 창에서 같이 고칠 때
--   번호가 어긋납니다. 보내신 것이 그 상품의 **전부**입니다.
-- ⚠️ 운영자가 가린 상품(`hidden`)은 여행사가 못 건드립니다.
create or replace function set_trip_depart(p jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_pv   text := my_provider();
  v_id   uuid := nullif(p->>'trip','')::uuid;
  v_kind text := coalesce(nullif(btrim(p->>'kind'),''), 'none');
  v_from date := nullif(p->>'from','')::date;
  v_to   date := nullif(p->>'to',''  )::date;
  v_arr  jsonb := coalesce(p->'dates', '[]'::jsonb);
  v_st   text;
  v_n    int;
begin
  if v_pv is null then raise exception '업체 담당자만 쓸 수 있습니다'; end if;
  if v_id is null then raise exception '어느 상품인지 알 수 없습니다'; end if;

  select state into v_st from trip
   where id = v_id and provider_id = v_pv for update;
  if v_st is null then raise exception '그 상품을 찾을 수 없습니다'; end if;
  if v_st = 'hidden' then
    raise exception '가려진 상품은 고칠 수 없습니다 — 고객센터로 문의해 주세요';
  end if;

  if v_kind not in ('dates','range','none') then
    raise exception '출발 방식은 확정 출발일 · 출발 가능 기간 · 미정 셋 가운데 하나입니다';
  end if;

  if v_kind = 'range' then
    if v_from is null or v_to is null then
      raise exception '출발 가능 기간은 시작일과 마지막 날을 함께 적어 주세요';
    end if;
    if v_to < v_from then
      raise exception '마지막 날이 시작일보다 앞설 수 없습니다';
    end if;
    if v_to < kst_today() then
      raise exception '이미 지난 기간입니다 — 오늘 이후로 적어 주세요';
    end if;
    if v_to > kst_today() + 730 then
      raise exception '출발 가능 기간은 2년 안으로 적어 주세요';
    end if;
  else
    v_from := null; v_to := null;
  end if;

  -- ⚠️ 확정 출발일은 **그 상품의 전부**로 갈아 끼웁니다
  delete from tripdate where trip_id = v_id;
  if v_kind = 'dates' then
    if jsonb_typeof(v_arr) <> 'array' then
      raise exception '출발일은 목록으로 보내 주세요';
    end if;
    insert into tripdate (trip_id, depart_on)
    select v_id, (x)::date
      from jsonb_array_elements_text(v_arr) t(x)
     where btrim(x) <> ''
    on conflict do nothing;
    select count(*) into v_n from tripdate where trip_id = v_id;
    if v_n = 0 then
      raise exception '출발일을 하나 이상 적어 주세요';
    end if;
    if v_n > 60 then
      raise exception '출발일은 60개까지 적을 수 있습니다';
    end if;
    -- ⚠️⚠️ **지난 날짜는 아예 안 받습니다** — 받아 두면 여행사 화면에는
    --   남고 손님 화면에서는 빠져 **둘이 다른 말**을 합니다.
    if exists (select 1 from tripdate
                where trip_id = v_id and depart_on < kst_today()) then
      raise exception '지난 날짜는 출발일로 넣을 수 없습니다';
    end if;
    if exists (select 1 from tripdate
                where trip_id = v_id and depart_on > kst_today() + 730) then
      raise exception '출발일은 2년 안으로 적어 주세요';
    end if;
  end if;

  update trip
     set depart_kind = v_kind, depart_from = v_from, depart_to = v_to,
         updated_at = now()
   where id = v_id;

  -- ⚠️ 기록에 **날짜를 안 담습니다** — 무엇을 바꿨는지는 상품을 보면
  --   됩니다. 기록은 오래 남고 보는 사람이 넓습니다.
  insert into audit_log (by_user, by_role, obj, obj_id, to_state, why)
  values (auth.uid(), my_role(), 'trip', v_id::text,
          'depart-' || v_kind, null);

  return jsonb_build_object('ok', true, 'kind', v_kind,
                            'n', coalesce(v_n, 0));
end $$;
revoke all on function set_trip_depart(jsonb) from public;
grant execute on function set_trip_depart(jsonb) to authenticated;

-- ⑤ 공개로 나가는 출발일 ──────────────────────────────────────────
-- ⚠️ 승인된 상품의 **오늘 이후** 날짜만 냅니다 — 여행사가 안 지워도
--   어제 날짜가 손님 화면에 남지 않습니다.
drop view if exists v_trip_date_public;
create view v_trip_date_public as
  select d.trip_id, d.depart_on
    from tripdate d
    join trip t      on t.id = d.trip_id
    join provider pv on pv.id = t.provider_id
   where d.depart_on >= kst_today()
     and t.state = 'approved' and pv.state = 'approved' and pv.is_test = false
   order by d.trip_id, d.depart_on;
grant select on v_trip_date_public to anon, authenticated;

-- 여행사가 제 작업실에서 보는 것 (상태와 상관없이 · 지난 날짜도)
drop view if exists v_trip_date_mine;
create view v_trip_date_mine as
  select d.trip_id, d.depart_on
    from tripdate d
    join trip t on t.id = d.trip_id
   where t.provider_id = my_provider()
   order by d.trip_id, d.depart_on;
grant select on v_trip_date_mine to authenticated;

-- ⑥ 보기 둘을 다시 만듭니다 ───────────────────────────────────────
-- ⚠️⚠️⚠️ `create or replace view` 는 **칸을 못 늘립니다.** 그리고
--   `v_trip_mine` 은 `select t.*` 이라 **다시 만들지 않으면 새 칸 셋이
--   영영 안 나옵니다**(에러 한 줄 없이 — 여행사 화면이 출발일을 못
--   읽습니다). 지우면 GRANT 도 같이 날아가므로 **바로 다시 줍니다.**
drop view if exists v_trip_open;
create view v_trip_open as
  select t.id, t.scope, t.dest, t.title, t.body, t.nights, t.days,
         t.price_from, t.price_note, t.incl, t.excl,
         t.created_at, t.updated_at,
         t.depart_kind, t.depart_from, t.depart_to,
         -- ⚠️ 못 찾으면 **빈 배열**입니다 — null 로 두면 화면이
         --   `months.length` 에서 터집니다.
         -- ⚠️⚠️ 날짜를 모으는 일은 **보기가 임자 권한으로** 합니다 —
         --   그래서 `tripdate` 를 읽을 권한이 없는 손님도 달을 봅니다.
         coalesce(trip_months(t.depart_kind, t.depart_from, t.depart_to, dd.days),
                  '{}'::text[]) as months,
         trip_next_depart(t.depart_kind, t.depart_from, t.depart_to, dd.days)
           as depart_next,
         pv.id   as provider_id,
         pv.name as provider_name,
         (select count(*) from tripphoto ph
           where ph.trip_id = t.id and ph.live) as photo_n,
         (select ph.path from tripphoto ph
           where ph.trip_id = t.id and ph.live
           order by ph.ord, ph.created_at, ph.id limit 1) as thumb
    from trip t
    join provider pv on pv.id = t.provider_id
    left join lateral (
      select array_agg(d.depart_on order by d.depart_on) as days
        from tripdate d where d.trip_id = t.id) dd on true
   where t.state = 'approved'
     and pv.state = 'approved'
     and pv.is_test = false;
grant select on v_trip_open to anon, authenticated;

drop view if exists v_trip_mine;
create view v_trip_mine as
  select t.*,
         coalesce(trip_months(t.depart_kind, t.depart_from, t.depart_to, dd.days),
                  '{}'::text[]) as months,
         trip_next_depart(t.depart_kind, t.depart_from, t.depart_to, dd.days)
           as depart_next,
         (select count(*) from tripdate d where d.trip_id = t.id) as date_n,
         (select count(*) from tripphoto ph
           where ph.trip_id = t.id and ph.live) as photo_n,
         (select count(*) from tripphoto ph
           where ph.trip_id = t.id and not ph.live) as photo_draft_n,
         (select count(*) from tripphoto ph
           where ph.trip_id = t.id and ph.drop_pending) as photo_drop_n
    from trip t
    left join lateral (
      select array_agg(d.depart_on order by d.depart_on) as days
        from tripdate d where d.trip_id = t.id) dd on true
   where t.provider_id = my_provider();
grant select on v_trip_mine to authenticated;

insert into schema_version (n, name) values (77, '0077_trip_depart')
on conflict (n) do nothing;

commit;

/* ---------------------------- 0078_job_fav.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
-- 0078 — 공고 **북마크**(저장) 와 내 저장 목록 (확정 시안 ⑨)
--
-- ⚠️⚠️⚠️ **0072 까지 담는 표가 없어서 북마크를 안 그렸습니다** — 그리면
--   눌러도 아무 일이 안 나는 단추니까요(절대 규칙 5). 지시가 「담는
--   구조가 없다는 것은 기능을 빼는 까닭이 아니다 · 북마크 저장 · 해제 ·
--   내 저장 목록과 사용자별 권한을 구현한다」이므로 **표를 만듭니다.**
--
-- ⚠️⚠️ **0069 의 `listingfav` 를 그대로 베낍니다** — 짜임새가 같습니다
--   (내가 담고 · 내가 빼고 · 내 것만 봅니다). 새로 설계하면 그 자리마다
--   다시 틀립니다(0056 이 0046 을 베낀 그 까닭).
--
-- ⚠️⚠️⚠️ **저장 수를 공개하지 않습니다.** 셀 수야 있지만 「인기 공고」로
--   읽히고 우리가 검증할 길이 없으며, 누가 무엇을 담았는지는 **행동
--   기록**이라 올린 분에게도 · **운영자에게도** 안 냅니다 (0059 의
--   `cqview` · 0069 의 찜과 같은 결). 그래서 `v_job_open` 에 `fav_n`
--   칸이 **아예 없습니다.**
--
-- ⚠️⚠️ **마감된 공고도 저장 목록에 남습니다** — `v_job_open` 을 그대로
--   썼으면 마감되는 순간 담아 둔 공고가 **조용히 사라집니다**
--   ("마감되었습니다" 를 보여 드리는 것이 맞습니다 · 0069 의 그 자리).
--   그래서 이 보기는 **표에서 직접** 셉니다.
--
-- 되돌아갔는지 보는 법:
--   select count(*) from pg_tables where tablename = 'jobfav';
--   select count(*) from pg_views  where viewname  = 'v_job_fav';
-- ════════════════════════════════════════════════════════════════════
begin;

create table if not exists jobfav (
  by_user    uuid not null references auth.users(id) on delete cascade,
  post_id    uuid not null references jobpost(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (by_user, post_id)
);
create index if not exists jobfav_mine_idx on jobfav (by_user, created_at desc);

alter table jobfav enable row level security;

-- ⚠️⚠️ **운영자 정책도 두지 않습니다** — 누가 무엇을 담았는지는 행동
--   기록이고 운영자가 그것을 읽을 까닭이 없습니다.
drop policy if exists jobfav_mine on jobfav;
create policy jobfav_mine on jobfav
  for select using (by_user = auth.uid());

-- ⚠️⚠️ **쓰기 GRANT 를 주지 않습니다** — 들어오는 길은 문 하나뿐입니다.
grant select on jobfav to authenticated;

-- ── 담고 빼는 문 ─────────────────────────────────────────────────
-- ⚠️ 켜고 끄는 것을 **문 하나**로 둡니다 — 둘로 나누면 화면이 지금
--   상태를 먼저 알아야 하고, 그 사이에 다른 창에서 바뀌면 어긋납니다.
create or replace function fav_jobpost(p jsonb default '{}'::jsonb)
  returns boolean
  language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
  v_j  uuid := nullif(btrim(coalesce(p->>'id','')), '')::uuid;
  v_on boolean := coalesce((p->>'on')::boolean, true);
  v_st text;
begin
  if v_me is null then raise exception '로그인이 필요합니다'; end if;
  if v_j is null then raise exception '어느 공고인지 알 수 없습니다'; end if;

  if v_on then
    select state into v_st from jobpost where id = v_j;
    if v_st is null then raise exception '그런 공고가 없습니다'; end if;
    -- ⚠️ 내려간 · 가려진 공고는 담을 수 없습니다 — 담아 두면 저장
    --   목록에 **열 수 없는 줄**이 쌓입니다.
    if v_st not in ('open','closed') then
      raise exception '지금은 저장할 수 없는 공고입니다';
    end if;
    if (select count(*) from jobfav where by_user = v_me) >= 200 then
      raise exception '저장은 200개까지입니다. 먼저 정리해 주세요';
    end if;
    insert into jobfav (by_user, post_id) values (v_me, v_j)
      on conflict (by_user, post_id) do nothing;
    return true;
  end if;

  delete from jobfav where by_user = v_me and post_id = v_j;
  return false;
end $$;
revoke all on function fav_jobpost(jsonb) from public;
grant execute on function fav_jobpost(jsonb) to authenticated;

-- ── 내 저장 목록 (`/my`) ─────────────────────────────────────────
-- ⚠️⚠️ **`v_job_open` 을 그대로 쓸 수 없습니다** (위 머리말) — 마감된
--   공고가 **조용히 사라집니다.** 표에서 직접 세고 `state` 를 그대로
--   냅니다. ⚠️ `contact` · `by_user` 는 **안 담습니다**(0048 의 선).
drop view if exists v_job_fav;
create view v_job_fav as
  select f.post_id as id, f.created_at as fav_at,
         j.kind, j.sub, j.region, j.title,
         j.pay, j.terms, j.close_at, j.state,
         j.role, j.emp_type, j.pay_type, j.pay_min,
         j.created_at,
         -- ⚠️ `as_pro` 는 **칸이 아닙니다** — 문이 `provider_id` 를 채웁니다.
         --   그리고 **읽을 때 다시** 상태를 봅니다(정지되면 그 순간 상호가
         --   빠집니다 · 0048 에서 세운 규칙).
         case when pv.id is not null and pv.state = 'approved'
                   and pv.is_test = false
              then pv.name end as pro_name
    from jobfav f
    join jobpost j on j.id = f.post_id
    left join provider pv on pv.id = j.provider_id
   where f.by_user = auth.uid()
     and j.state in ('open','closed')
   order by f.created_at desc;
grant select on v_job_fav to authenticated;

insert into schema_version (n, name) values (78, '0078_job_fav')
on conflict (n) do nothing;

commit;

/* ---------------------------- 0079_fitting_terms.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
-- 0079 — 피팅 **거래 조건**(부품비 포함 여부 등)을 업체가 적습니다
--        (확정 시안 ⑦ · save_provider_self 0076→0079 · v_provider_card 0076→0079)
--
-- ⚠️⚠️⚠️ **시안의 「부품비 별도 · 최종 견적 상담」을 우리가 적지
--   않습니다.** 업체마다 다르고 우리가 확인할 길이 없습니다 — 우리가
--   적으면 **우리가 한 약속**이 되고, 그 조건이 다른 업체에 가서 분쟁이
--   납니다(절대 규칙 1 · 5). 지시가 「거래 조건은 업체 입력값으로
--   표시한다」이므로 **업체가 적는 칸**을 만듭니다.
-- ⚠️ 비우면 화면에서 **줄째 빠집니다**(절대 규칙 2) — 「협의」를 지어
--   적지 않습니다.
--
-- ⚠️⚠️ **`created_at` 도 같이 내보냅니다.** 지시가 「근거 없는 추천순은
--   최신 등록순 등으로 대체한다」인데, 공개 카드 보기에 **등록 시각이
--   없어서** 최신순으로 세울 수가 없었습니다. 「추천순」은 여전히 안
--   냅니다 — 무엇이 추천인지 세어 본 적이 없습니다.
--
-- ⚠️⚠️⚠️ **보기를 지우고 다시 만듭니다** — `create or replace view` 는
--   칸을 못 늘립니다(0044 가 붙여넣기 두 번째에서 멈춘 그 자리).
--   지우면 GRANT 도 같이 날아가니 **바로 다시 줍니다.**
-- ⚠️⚠️ **`save_provider_self` 는 보낸 것으로 통째로 덮습니다** — 그래서
--   `js/deskme.js` 가 새 칸을 **읽고 또 보내야** 합니다. 안 하면 업체가
--   저장할 때마다 그 칸이 비워집니다(`industries` 로 겪은 자리).
--
-- 되돌아갔는지 보는 법:
--   select column_name from information_schema.columns
--    where table_name = 'v_provider_card' and column_name = 'fit_terms';
-- ════════════════════════════════════════════════════════════════════
begin;

alter table provider add column if not exists fit_terms text;
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'provider_fit_terms_ck') then
    alter table provider add constraint provider_fit_terms_ck
      check (fit_terms is null or char_length(fit_terms) <= 120);
  end if;
end $$;

drop view if exists v_provider_card;
create view v_provider_card as
  select p.id, p.name, p.intro, p.regions, p.gu, p.subs, p.since,
         p.consult_hours, p.verified, p.brands, p.scale, p.contact_ways,
         p.ceo, p.addr, p.tel, p.email, p.brn,
         p.kind, p.place_name, p.lesson_goals,
         p.range_opts, p.open_hours,
         p.fit_ways,
         -- ⚠️ 0079 — 업체가 적는 거래 조건 (비면 화면에서 줄째 빠집니다)
         p.fit_terms,
         -- ⚠️ 0079 — 「최신 등록순」으로 세우려면 이 값이 있어야 합니다
         p.created_at,
         p.is_test
    from provider p
   where p.listed = true
     and p.is_test = false
     and p.state = 'approved';
grant select on v_provider_card to anon, authenticated;

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
  -- ⚠️ 0074 — 연습장 시설 정보 둘
  v_hours text    := nullif(btrim(coalesce(p_data->>'openHours','')), '');
  v_opts  text[]  := coalesce((select array_agg(btrim(x))
    from jsonb_array_elements_text(
      case when jsonb_typeof(p_data->'rangeOpts') = 'array'
           then p_data->'rangeOpts' else '[]'::jsonb end) x
    where btrim(x) <> ''), '{}');
  -- ⚠️ 0076 — 피팅 이용 방식
  v_fw    text[]  := coalesce((select array_agg(btrim(x))
    from jsonb_array_elements_text(
      case when jsonb_typeof(p_data->'fitWays') = 'array'
           then p_data->'fitWays' else '[]'::jsonb end) x
    where btrim(x) <> ''), '{}');
  -- ⚠️ 0079 — 피팅 거래 조건 (부품비 포함 여부 등). **업체가 적는
  --   값**이고 우리가 지어내지 않습니다 — 비면 화면에서 줄째 빠집니다.
  v_fterms text := nullif(btrim(coalesce(p_data->>'fitTerms','')), '');
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
  -- ⚠️ 0074 — 이용 시간과 시설 속성. **키 묶음은 화면이 들고 있고**
  --   여기서는 갯수와 길이만 봅니다 (박아 두면 느는 날 어긋납니다).
  if v_fterms is not null and char_length(v_fterms) > 120 then
    raise exception '거래 조건은 120자까지 적을 수 있습니다';
  end if;
  if v_hours is not null and char_length(v_hours) > 60 then
    raise exception '이용 시간이 너무 깁니다 (60자)';
  end if;
  if coalesce(array_length(v_opts, 1), 0) > 12 then
    raise exception '시설 항목은 열둘까지입니다';
  end if;
  if exists (select 1 from unnest(v_opts) u where char_length(u) > 40) then
    raise exception '시설 항목 값이 올바르지 않습니다';
  end if;
  -- ⚠️ 0076 — 이용 방식. 표의 check 와 **다른 말**로 거절합니다
  --   (같은 말로 거절하면 어느 자물쇠가 막았는지 알 수 없습니다).
  if coalesce(array_length(v_fw, 1), 0) > 6 then
    raise exception '이용 방식은 여섯 가지까지입니다';
  end if;
  if exists (select 1 from unnest(v_fw) u where char_length(u) > 40) then
    raise exception '이용 방식 값이 올바르지 않습니다';
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
    range_opts = v_opts,
    open_hours = v_hours,
    fit_ways = v_fw,
    fit_terms = v_fterms,
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
insert into schema_version (n, name) values (79, '0079_fitting_terms')
on conflict (n) do nothing;

commit;

/* ---------------------------- 0080_join_level_listing_spec.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
-- 0080 — 조인 「실력」 · 중고 「샤프트 플렉스 · 좌/우타」
--        (확정 시안 ② · ③ · 2026-11-13)
--
-- ⚠️⚠️⚠️ **아직 운영에 올리지 않았습니다.** 연결 대상(어느 Supabase
--   프로젝트인가)이 확정되기 전이라, 이 파일은 **초안 + 검사**까지만
--   돼 있습니다. 적용은 승인 뒤입니다.
--
-- 무엇을 더하나 — **칸 셋뿐**입니다. 지우거나 이름을 바꾸는 줄이
-- 한 줄도 없습니다(전부 `add column if not exists`).
--   · joinroom.level  조인에 맞는 실력  (시안 ② 의 「실력」 거르개)
--   · listing.flex    샤프트 플렉스      (시안 ③ 의 「샤프트 플렉스」)
--   · listing.hand    좌타 · 우타        (시안 ③ 의 「좌/우타」)
--
-- ⚠️⚠️ **셋 다 비울 수 있습니다(null).** 이미 올라온 줄은 전부 null 이
--   되고, 그 줄들은 **그 조건으로 좁히면 빠집니다** — 모르는 값을 아무
--   칸에나 채우면 지어낸 값입니다(절대 규칙 1). 화면이 그 사실을 0건
--   안내에서 말합니다(피팅의 「이용 방식을 안 고르신 업체는 빠집니다」와
--   같은 결).
--
-- ⚠️⚠️⚠️ **칸을 더하면 칸 GRANT 도 같이 줘야 합니다.** `joinroom` 과
--   `listing` 은 **칸 단위**로 select 를 줍니다(연락처 · 동의 시각을
--   빼려고). 칸 단위 GRANT 는 **나중에 생긴 칸을 저절로 안 덮습니다** —
--   2026-11-09 에 `listing.model` 이 그래서 `/my` 의 「내 판매글」 상자를
--   통째로 비웠습니다(안 준 칸을 부르면 0줄이 아니라 **질의가 통째로
--   거절**됩니다).
--
-- ⚠️⚠️ **check 를 답니다**(`cond` 와 같은 결) — 값이 몇 개뿐이고 화면이
--   그 글자로 이름을 찾기 때문입니다. ⚠️ 값을 늘리시려면 **마이그레이션이
--   필요합니다**(`listing.sub` 는 반대로 일부러 안 박았습니다 — 거기는
--   종류가 계속 늡니다).
--
-- ⚠️⚠️ **앞 번호를 단독으로 다시 돌리시면** — 0069 는 `drop view if
--   exists v_listing_open; create view …` 꼴이라 **에러 없이** 0069 의
--   칸 목록으로 되돌아갑니다(= `flex` · `hand` 가 조용히 사라집니다).
--   붙여넣기 파일(`db/apply-from-0008.sql`)은 **번호 차례로** 돌므로
--   0080 이 뒤에 와서 다시 채웁니다. 한 파일만 따로 돌리실 일이 있으면
--   **0080 도 같이** 돌리세요.
--
-- 되돌아갔는지 보는 법:
--   select column_name from information_schema.columns
--    where table_name = 'listing' and column_name in ('flex','hand');
--   select has_column_privilege('authenticated','listing','flex','SELECT');
-- ════════════════════════════════════════════════════════════════════

-- ── ① 조인 — 실력 ────────────────────────────────────────────────
alter table joinroom add column if not exists level text;
alter table joinroom drop constraint if exists joinroom_level_ck;
alter table joinroom add  constraint joinroom_level_ck
  check (level is null or level in ('any','beginner','mid','low'));

-- ⚠️ 칸 GRANT — 안 주면 `/my` 의 「내 조인」이 통째로 비워집니다
grant select (level) on joinroom to authenticated;

-- ── ② 중고 — 샤프트 플렉스 · 좌/우타 ─────────────────────────────
alter table listing add column if not exists flex text;
alter table listing add column if not exists hand text;
alter table listing drop constraint if exists listing_flex_ck;
alter table listing add  constraint listing_flex_ck
  check (flex is null or flex in ('r','sr','s','x'));
alter table listing drop constraint if exists listing_hand_ck;
alter table listing add  constraint listing_hand_ck
  check (hand is null or hand in ('right','left'));

grant select (flex, hand) on listing to authenticated;

-- ⚠️ 거르개가 쓰는 칸이라 인덱스를 답니다 — 값이 있는 줄만 담습니다
--   (대부분이 null 이라 전체 인덱스는 자리만 먹습니다).
create index if not exists listing_flex_idx on listing (flex)
  where flex is not null;
create index if not exists listing_hand_idx on listing (hand)
  where hand is not null;
create index if not exists joinroom_level_idx on joinroom (level)
  where level is not null;

-- ── ③ 여는 문 · 고치는 문 (조인) ─────────────────────────────────
-- ⚠️⚠️ `open_joinroom` 은 0046 이 마지막입니다 — 여기서 덮습니다
--   (check-chains 가 그 짝을 셉니다 · 0046→0080).
-- ⚠️ 바뀐 것은 **`level` 한 칸뿐**입니다. 나머지는 0046 그대로입니다.
create or replace function open_joinroom(p jsonb)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_uid     uuid := auth.uid();
  v_region  text := nullif(btrim(coalesce(p->>'region','')), '');
  v_play    date;
  v_title   text := nullif(btrim(coalesce(p->>'title','')), '');
  v_body    text := nullif(btrim(coalesce(p->>'body','')), '');
  v_course  text := nullif(btrim(coalesce(p->>'course','')), '');
  v_tee     text := nullif(btrim(coalesce(p->>'tee','')), '');
  v_note    text := nullif(btrim(coalesce(p->>'note','')), '');
  v_level   text := nullif(btrim(coalesce(p->>'level','')), '');
  v_contact text := nullif(btrim(coalesce(p->>'contact','')), '');
  v_need    int;
  v_budget  int;
  v_id      uuid;
begin
  if v_uid is null then raise exception '로그인이 필요합니다'; end if;
  if v_region is null then raise exception '지역을 골라 주세요'; end if;
  if v_title is null or char_length(v_title) < 2 then
    raise exception '제목을 두 글자 이상 적어 주세요';
  end if;
  if char_length(v_title) > 60 then
    raise exception '제목이 너무 깁니다 (60자)';
  end if;
  if p->>'play_at' is null or btrim(p->>'play_at') = '' then
    raise exception '언제 치실지 골라 주세요';
  end if;
  begin
    v_play := (p->>'play_at')::date;
  exception when others then
    raise exception '날짜가 올바르지 않습니다';
  end;
  if v_play < kst_today() then
    raise exception '지난 날짜로는 열 수 없습니다';
  end if;
  if v_play > kst_today() + 90 then
    raise exception '90일 뒤까지만 열 수 있습니다';
  end if;
  if p->>'need' is null or btrim(p->>'need') = '' then
    raise exception '몇 분을 찾으시는지 적어 주세요';
  end if;
  begin
    v_need := btrim(p->>'need')::int;
  exception when others then
    raise exception '인원은 숫자로 적어 주세요';
  end;
  if v_need < 1 or v_need > 3 then
    raise exception '찾으시는 인원은 1~3명입니다';
  end if;
  if nullif(btrim(coalesce(p->>'budget','')), '') is not null then
    begin
      v_budget := btrim(p->>'budget')::int;
    exception when others then
      raise exception '예상 비용은 숫자로 적어 주세요';
    end;
    if v_budget < 0 or v_budget > 100000000 then
      raise exception '예상 비용이 올바르지 않습니다';
    end if;
  end if;
  -- ⚠️ 실력은 **안 고르셔도 됩니다** — 고르셨으면 아는 값이어야 합니다
  --   (모르는 글자를 담으면 화면이 「미확인」을 찍습니다).
  if v_level is not null and v_level not in ('any','beginner','mid','low') then
    raise exception '실력 값이 올바르지 않습니다';
  end if;
  if v_contact is null then raise exception '연락처를 적어 주세요'; end if;
  if length(v_contact) > 100 then raise exception '연락처가 너무 깁니다'; end if;
  if p->>'agree_at' is null then
    raise exception '개인정보 수집 · 이용 동의가 필요합니다';
  end if;
  if (p->>'agree_at')::timestamptz > now() + interval '5 minutes'
     or (p->>'agree_at')::timestamptz < now() - interval '1 day' then
    raise exception '동의 시각이 올바르지 않습니다';
  end if;
  if (select count(*) from joinroom
       where by_user = v_uid and state = 'open') >= 5 then
    raise exception '열어 두신 자리가 다섯입니다. 먼저 정리해 주세요';
  end if;
  if (select count(*) from joinroom
       where by_user = v_uid and created_at > now() - interval '1 day') >= 10 then
    raise exception '오늘은 더 열 수 없습니다 (하루 열 개)';
  end if;

  insert into joinroom (by_user, region, play_at, title, body, course,
                        tee, need, budget, note, level, contact, agree_at)
  values (v_uid, v_region, v_play, v_title, v_body, v_course,
          v_tee, v_need, v_budget, v_note, v_level,
          v_contact, (p->>'agree_at')::timestamptz)
  returning id into v_id;
  return v_id;
end $$;
revoke all on function open_joinroom(jsonb) from public;
grant execute on function open_joinroom(jsonb) to authenticated;

-- ⚠️⚠️ 고치는 문 — **보낸 칸만** 고칩니다. 날짜 · 지역은 여전히 못
--   고칩니다(신청하신 분이 다른 자리에 묶입니다 · 0046 의 그 까닭).
-- ⚠️ 실력은 **비우는 것도 보내는 것**입니다 — `p ? 'level'` 로 갈립니다
--   (`coalesce` 로 받으면 빈 글자가 「안 보냈다」 와 섞여 못 지웁니다 ·
--   0069 의 `model` 자리).
create or replace function edit_joinroom(p jsonb)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_uid    uuid := auth.uid();
  v_id     uuid := nullif(btrim(coalesce(p->>'id','')), '')::uuid;
  v_owner  uuid;
  v_state  text;
  v_title  text := nullif(btrim(coalesce(p->>'title','')), '');
  v_body   text := nullif(btrim(coalesce(p->>'body','')), '');
  v_course text := nullif(btrim(coalesce(p->>'course','')), '');
  v_tee    text := nullif(btrim(coalesce(p->>'tee','')), '');
  v_note   text := nullif(btrim(coalesce(p->>'note','')), '');
  v_need   int;
  v_budget int;
begin
  if v_uid is null then raise exception '로그인이 필요합니다'; end if;
  if v_id is null then raise exception '어느 자리인지 알 수 없습니다'; end if;
  select by_user, state into v_owner, v_state
    from joinroom where id = v_id for update;
  if v_state is null then raise exception '그런 자리가 없습니다'; end if;
  if not coalesce(v_owner = v_uid, false) then
    raise exception '여신 분만 고치실 수 있습니다';
  end if;
  if v_state <> 'open' then
    raise exception '열려 있는 자리만 고치실 수 있습니다';
  end if;
  if v_title is null or char_length(v_title) < 2 then
    raise exception '제목을 두 글자 이상 적어 주세요';
  end if;
  if char_length(v_title) > 60 then
    raise exception '제목이 너무 깁니다 (60자)';
  end if;
  if p->>'need' is null or btrim(p->>'need') = '' then
    raise exception '몇 분을 찾으시는지 적어 주세요';
  end if;
  begin
    v_need := btrim(p->>'need')::int;
  exception when others then
    raise exception '인원은 숫자로 적어 주세요';
  end;
  if v_need < 1 or v_need > 3 then
    raise exception '찾으시는 인원은 1~3명입니다';
  end if;
  -- ⚠️ 이미 수락한 분보다 적게 줄이지 못합니다
  if v_need < (select count(*) from joinapply a
                where a.room_id = v_id and a.state = 'accepted') then
    raise exception '이미 수락하신 분보다 적게 줄일 수 없습니다';
  end if;
  if nullif(btrim(coalesce(p->>'budget','')), '') is not null then
    begin
      v_budget := btrim(p->>'budget')::int;
    exception when others then
      raise exception '예상 비용은 숫자로 적어 주세요';
    end;
    if v_budget < 0 or v_budget > 100000000 then
      raise exception '예상 비용이 올바르지 않습니다';
    end if;
  end if;
  if p ? 'level' then
    if nullif(btrim(coalesce(p->>'level','')), '') is not null
       and btrim(p->>'level') not in ('any','beginner','mid','low') then
      raise exception '실력 값이 올바르지 않습니다';
    end if;
  end if;

  update joinroom
     set title = v_title, body = v_body, course = v_course,
         tee = v_tee, note = v_note, need = v_need, budget = v_budget,
         level = case when p ? 'level'
                      then nullif(btrim(coalesce(p->>'level','')), '')
                      else level end,
         updated_at = now()
   where id = v_id;
  return v_id;
end $$;
revoke all on function edit_joinroom(jsonb) from public;
grant execute on function edit_joinroom(jsonb) to authenticated;

-- ── ④ 공개 보기에 칸을 더합니다 ──────────────────────────────────
-- ⚠️⚠️⚠️ **`create or replace view` 로 칸을 더할 수 있습니다** — 제가
--   앞서 「칸을 못 늘립니다」 라고 적은 것은 **틀렸습니다.** 임시
--   Postgres 16 에서 재서 고쳤습니다(2026-11-13). 규칙은 이렇습니다:
--     · 맨 **뒤에** 더하기        → 됩니다
--     · 가운데에 끼우기 · 차례 바꾸기 → `cannot change name of view
--       column "b" to "c"` 로 거절
--     · 칸 빼기                   → `cannot drop columns from view` 로 거절
--   0044 가 멈춘 자리는 「칸을 더해서」가 아니라, **앞 번호 파일이
--   옛 칸 목록으로 다시 만들려 해서**(= 칸을 빼는 꼴) 였습니다.
--
-- ⚠️⚠️ **그래서 drop 보다 replace 가 낫습니다** — 재서 확인한 차이:
--     | 무엇            | create or replace | drop + create |
--     | 권한(GRANT)     | **그대로 남음**   | **사라짐** (다시 줘야 합니다) |
--     | 기대는 객체     | **그대로 남음**   | `cannot drop view … because
--     |                 |                   |  other objects depend on it` |
--   지금은 기대는 보기가 없지만(확인함 — `v_join_count` 는 표를 직접
--   셉니다), 뒤에 하나라도 생기면 drop 쪽이 그 자리에서 멈춥니다.
--   ⚠️ `security_invoker` · `security_barrier` 같은 옵션이 replace 에서
--   그대로 남는지는 **이번에 확인하지 못했습니다** — 지금 두 보기에는
--   그 옵션이 걸려 있지 않습니다(0046 · 0056 · 0060 · 0069 에 없습니다).
--   붙이시는 날 그 자리를 다시 재세요.
--
-- ⚠️⚠️⚠️ **그래서 새 칸은 반드시 맨 뒤입니다.** 보기 좋으라고 `brand`
--   옆에 끼우면 그 순간 replace 가 거절합니다.
create or replace view v_join_open as
  select r.id, r.region, r.play_at, r.title, r.body, r.course, r.booked,
         r.tee, r.need, r.budget, r.note, r.created_at,
         (select count(*) from joinapply a
           where a.room_id = r.id and a.state = 'accepted') as taken_n,
         r.need - (select count(*) from joinapply a
                    where a.room_id = r.id and a.state = 'accepted') as left_n,
         (select count(*) from joinapply a
           where a.room_id = r.id and a.state = 'applied') as waiting_n,
         -- ⚠️ 새 칸은 **맨 뒤**입니다 (위 설명)
         r.level
    from joinroom r
   where r.state = 'open'
     and r.play_at >= kst_today();
-- ⚠️ replace 는 권한을 그대로 두지만, **한 번 더 주는 것은 해롭지
--   않습니다** — 앞 번호를 단독으로 다시 돌려 drop 이 났을 때를 위해
--   남겨 둡니다(두 번 줘도 아무 일도 안 일어납니다).
grant select on v_join_open to anon, authenticated;

create or replace view v_listing_open as
  select l.id, l.sub, l.region, l.ship, l.title, l.body, l.price, l.cond,
         l.brand, l.model, l.state, l.created_at,
         left(coalesce(nullif(btrim(a.name), ''), '회원'), 1) ||
         repeat('*', greatest(
           char_length(coalesce(nullif(btrim(a.name), ''), '회원')) - 1, 0))
           as seller,
         (select count(*) from listingask k
           where k.listing_id = l.id and k.state = 'asked') as ask_n,
         (select count(*) from listingphoto f where f.listing_id = l.id) as photo_n,
         (select f.path from listingphoto f
           where f.listing_id = l.id
           order by f.ord, f.created_at, f.id limit 1) as thumb,
         -- ⚠️ 새 칸 둘도 **맨 뒤**입니다
         l.flex, l.hand
    from listing l
    left join account a on a.id = l.by_user
   where l.state in ('open','reserved');
grant select on v_listing_open to anon, authenticated;

-- ── ⑤ 중고 — 여는 문 · 고치는 문에 칸 둘 ─────────────────────────
-- ⚠️ 바뀐 것은 **`flex` · `hand` 두 칸뿐**입니다. 나머지는 0069 그대로.
create or replace function open_listing(p jsonb)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_uid     uuid := auth.uid();
  v_sub     text := nullif(btrim(coalesce(p->>'sub','')), '');
  v_region  text := nullif(btrim(coalesce(p->>'region','')), '');
  v_title   text := nullif(btrim(coalesce(p->>'title','')), '');
  v_body    text := nullif(btrim(coalesce(p->>'body','')), '');
  v_cond    text := nullif(btrim(coalesce(p->>'cond','')), '');
  v_contact text := nullif(btrim(coalesce(p->>'contact','')), '');
  v_brand   text := nullif(btrim(coalesce(p->>'brand','')), '');
  v_model   text := nullif(btrim(coalesce(p->>'model','')), '');
  v_flex    text := nullif(btrim(coalesce(p->>'flex','')), '');
  v_hand    text := nullif(btrim(coalesce(p->>'hand','')), '');
  v_ship    boolean := coalesce((p->>'ship')::boolean, false);
  v_price   int;
  v_id      uuid;
begin
  if v_uid is null then raise exception '로그인이 필요합니다'; end if;
  if v_sub is null then raise exception '물건 종류를 골라 주세요'; end if;
  if v_region is null then raise exception '지역을 골라 주세요'; end if;
  if v_brand is null then
    raise exception '브랜드를 골라 주세요 (모르시면 기타)';
  end if;
  if char_length(v_brand) > 30 then
    raise exception '브랜드가 너무 깁니다 (30자)';
  end if;
  if v_model is not null and char_length(v_model) > 40 then
    raise exception '모델명이 너무 깁니다 (40자)';
  end if;
  -- ⚠️ 플렉스 · 좌우타는 **안 고르셔도 됩니다**(클럽이 아닌 물건도
  --   있습니다). 고르셨으면 아는 값이어야 합니다.
  if v_flex is not null and v_flex not in ('r','sr','s','x') then
    raise exception '샤프트 플렉스 값이 올바르지 않습니다';
  end if;
  if v_hand is not null and v_hand not in ('right','left') then
    raise exception '좌타 · 우타 값이 올바르지 않습니다';
  end if;
  if v_title is null or char_length(v_title) < 2 then
    raise exception '제목을 두 글자 이상 적어 주세요';
  end if;
  if char_length(v_title) > 60 then
    raise exception '제목이 너무 깁니다 (60자)';
  end if;
  if v_body is null or char_length(v_body) < 5 then
    raise exception '설명을 다섯 글자 이상 적어 주세요';
  end if;
  if char_length(v_body) > 2000 then
    raise exception '설명이 너무 깁니다 (2000자)';
  end if;
  if p->>'price' is null or btrim(p->>'price') = '' then
    raise exception '값을 적어 주세요 (무료로 나누시면 0)';
  end if;
  begin
    v_price := btrim(p->>'price')::int;
  exception when others then
    raise exception '값은 숫자로 적어 주세요';
  end;
  if v_price < 0 or v_price > 100000000 then
    raise exception '값이 올바르지 않습니다';
  end if;
  if v_cond is null then raise exception '물건 상태를 골라 주세요'; end if;
  if v_cond not in ('new','like','good','fair') then
    raise exception '물건 상태가 올바르지 않습니다';
  end if;
  if v_contact is null then raise exception '연락처를 적어 주세요'; end if;
  if length(v_contact) > 100 then raise exception '연락처가 너무 깁니다'; end if;
  if p->>'agree_at' is null then
    raise exception '개인정보 수집 · 이용 동의가 필요합니다';
  end if;
  if (p->>'agree_at')::timestamptz > now() + interval '5 minutes'
     or (p->>'agree_at')::timestamptz < now() - interval '1 day' then
    raise exception '동의 시각이 올바르지 않습니다';
  end if;
  if (select count(*) from listing
       where by_user = v_uid and state in ('open','reserved')) >= 10 then
    raise exception '팔고 계신 매물이 열입니다. 먼저 정리해 주세요';
  end if;
  if (select count(*) from listing
       where by_user = v_uid and created_at > now() - interval '1 day') >= 20 then
    raise exception '오늘은 더 올릴 수 없습니다 (하루 스무 개)';
  end if;

  insert into listing (by_user, sub, region, ship, title, body, price,
                       cond, contact, agree_at, brand, model, flex, hand)
  values (v_uid, v_sub, v_region, v_ship, v_title, v_body, v_price,
          v_cond, v_contact, (p->>'agree_at')::timestamptz,
          v_brand, v_model, v_flex, v_hand)
  returning id into v_id;
  return v_id;
end $$;
revoke all on function open_listing(jsonb) from public;
grant execute on function open_listing(jsonb) to authenticated;

-- ⚠️⚠️ 고치는 문 — **보낸 칸만** 고칩니다. 플렉스 · 좌우타도 모델명과
--   같이 **비우는 것이 보내는 것**입니다(`p ? '...'`).
create or replace function edit_listing(p jsonb)
returns text
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_id  uuid := nullif(btrim(coalesce(p->>'id','')), '')::uuid;
  v_own uuid;
  v_st  text;
  v_n   int;
begin
  if v_uid is null then raise exception '로그인이 필요합니다'; end if;
  if v_id is null then raise exception '어느 매물인지 알 수 없습니다'; end if;

  select by_user, state into v_own, v_st from listing where id = v_id for update;
  if v_st is null then raise exception '그런 매물이 없습니다'; end if;
  if not coalesce(v_own = v_uid, false) then
    raise exception '올리신 분만 고치실 수 있습니다';
  end if;
  if v_st not in ('open','reserved') then
    raise exception '팔고 있는 매물만 고치실 수 있습니다';
  end if;

  if p ? 'title' then
    if char_length(btrim(coalesce(p->>'title',''))) < 2
       or char_length(btrim(p->>'title')) > 60 then
      raise exception '제목은 2~60자입니다';
    end if;
  end if;
  if p ? 'body' then
    if char_length(btrim(coalesce(p->>'body',''))) < 5
       or char_length(btrim(p->>'body')) > 2000 then
      raise exception '설명은 5~2000자입니다';
    end if;
  end if;
  if p ? 'brand' then
    if nullif(btrim(coalesce(p->>'brand','')), '') is null then
      raise exception '브랜드를 골라 주세요 (모르시면 기타)';
    end if;
    if char_length(btrim(p->>'brand')) > 30 then
      raise exception '브랜드가 너무 깁니다 (30자)';
    end if;
  end if;
  if p ? 'model' and char_length(btrim(coalesce(p->>'model',''))) > 40 then
    raise exception '모델명이 너무 깁니다 (40자)';
  end if;
  if p ? 'flex' then
    if nullif(btrim(coalesce(p->>'flex','')), '') is not null
       and btrim(p->>'flex') not in ('r','sr','s','x') then
      raise exception '샤프트 플렉스 값이 올바르지 않습니다';
    end if;
  end if;
  if p ? 'hand' then
    if nullif(btrim(coalesce(p->>'hand','')), '') is not null
       and btrim(p->>'hand') not in ('right','left') then
      raise exception '좌타 · 우타 값이 올바르지 않습니다';
    end if;
  end if;
  if p ? 'price' then
    if nullif(btrim(coalesce(p->>'price','')), '') is null then
      raise exception '값을 적어 주세요 (무료로 나누시면 0)';
    end if;
    if (p->>'price')::int < 0 or (p->>'price')::int > 100000000 then
      raise exception '값이 올바르지 않습니다';
    end if;
  end if;
  if p ? 'cond' and coalesce(p->>'cond','') not in ('new','like','good','fair') then
    raise exception '물건 상태가 올바르지 않습니다';
  end if;
  if p ? 'contact' and length(coalesce(p->>'contact','')) > 100 then
    raise exception '연락처가 너무 깁니다';
  end if;

  update listing set
    sub     = coalesce(nullif(btrim(coalesce(p->>'sub','')),    ''), sub),
    region  = coalesce(nullif(btrim(coalesce(p->>'region','')), ''), region),
    title   = coalesce(nullif(btrim(coalesce(p->>'title','')),  ''), title),
    body    = coalesce(nullif(btrim(coalesce(p->>'body','')),   ''), body),
    cond    = coalesce(nullif(btrim(coalesce(p->>'cond','')),   ''), cond),
    brand   = coalesce(nullif(btrim(coalesce(p->>'brand','')),  ''), brand),
    model   = case when p ? 'model'
                   then nullif(btrim(coalesce(p->>'model','')), '')
                   else model end,
    flex    = case when p ? 'flex'
                   then nullif(btrim(coalesce(p->>'flex','')), '')
                   else flex end,
    hand    = case when p ? 'hand'
                   then nullif(btrim(coalesce(p->>'hand','')), '')
                   else hand end,
    price   = coalesce(nullif(btrim(coalesce(p->>'price','')),  '')::int, price),
    ship    = coalesce((p->>'ship')::boolean, ship),
    contact = coalesce(nullif(btrim(coalesce(p->>'contact','')), ''), contact),
    updated_at = now()
   where id = v_id;
  get diagnostics v_n = row_count;
  if v_n = 0 then raise exception '고치지 못했습니다'; end if;
  return 'edited';
end $$;
revoke all on function edit_listing(jsonb) from public;
grant execute on function edit_listing(jsonb) to authenticated;

insert into schema_version (n, name) values (80, '0080_join_level_listing_spec')
on conflict (n) do nothing;

/* ---------------------------- 0081_course_photo.sql ---------------------------- */
-- ════════════════════════════════════════════════════════════════════
-- 0081 — 골프장 마스터에 **사진 한 장** (확정 시안 ① 의 티타임 카드)
--
-- ⚠️⚠️⚠️ **아직 운영에 올리지 않았습니다.** 0080 과 같습니다 — 연결
--   대상(어느 Supabase 프로젝트인가)이 확정되고, survey 로 기존 구조 ·
--   권한 · 트리거 · 부분 적용을 확인한 뒤에 범위를 정해 올립니다.
--
-- 무엇을 더하나 — **칸 하나**입니다. 지우거나 이름을 바꾸는 줄이 한
-- 줄도 없습니다.
--   · course.photo        골프장 대표 사진의 **경로** (비울 수 있습니다)
--   · v_teetime_open.photo  그 티타임이 이어진 마스터의 사진 (없으면 null)
--
-- ⚠️⚠️⚠️ **이것은 「제휴가 필요한 값」이 아닙니다.** 0066 이 칸을 아예
--   안 만든 것은 **실시간 잔여 티타임 · 그린피 · 회원권 호가 · 상품
--   재고** 입니다 — 우리가 **확인할 수 없는 사실**이라 칸을 만들면
--   누군가 지어내서 채웁니다. 사진은 다릅니다: **운영자가 권리를 확인하고
--   올리는 자산**이고, 비어 있으면 화면이 **아이콘 타일**로 돌아갑니다
--   (0051 의 업체 시설 사진과 같은 규칙).
--
-- ⚠️⚠️ **업체 사진을 골프장 사진 자리에 쓰지 않습니다.** 「(예시) 수도권
--   부킹센터」의 사무실 사진을 「그린밸리CC」 카드에 깔면 손님은 그것을
--   **그 골프장 사진**으로 읽습니다(표시 · 광고의 공정화에 관한 법률
--   제3조). 그래서 사진은 **골프장 마스터**(`course`)에 답니다 — 이름이
--   붙은 그 골프장의 사진입니다.
--
-- ⚠️⚠️ **아직 없는 것 — 올리는 자리.** 이 번호는 **담는 칸과 내보내는
--   길**까지입니다. 운영자가 파일을 올리는 화면(`api/upload.js` 의
--   `course` 가지 + `claim_course_photo` 문)은 **다음 번호**입니다.
--   지금은 `/admin` 의 골프장 양식에서 **경로를 적는 칸**이 있습니다 —
--   공개 버킷에 이미 올라간 파일을 가리키는 자리입니다.
--   ⚠️ 그래서 이 줄을 적어 둡니다: **「만들어 놓고 안 쓰는 칸」이 되지
--   않게**, 올리는 자리를 내는 날 이 머리말을 같이 고치세요.
--
-- 되돌아갔는지 보는 법 —
--   select column_name from information_schema.columns
--    where table_name = 'course' and column_name = 'photo';
--   select column_name from information_schema.columns
--    where table_name = 'v_teetime_open' and column_name = 'photo';
-- ════════════════════════════════════════════════════════════════════

-- ── ① 칸 ────────────────────────────────────────────────────────────
-- ⚠️ 비울 수 있습니다(null). 이미 들어와 있는 골프장 수천 곳은 전부
--    null 이 되고, 그 줄들은 화면에서 **아이콘 타일**로 그려집니다.
alter table course add column if not exists photo text;

-- ⚠️⚠️ **경로 꼴을 DB 가 다시 봅니다** — 화면에서만 막으면 꾸러미를
--    고쳐 지나갑니다(0051 · 0068 에서 세운 규칙). 공개 버킷의
--    `course/<uuid>/...` 아래만 가리킬 수 있습니다.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'course_photo_ck') then
    alter table course add constraint course_photo_ck
      check (photo is null or
             (photo ~ '^course/[0-9a-f-]{36}/[A-Za-z0-9._-]{1,80}$'
              and position('..' in photo) = 0));
  end if;
end $$;

-- ── ② 운영자가 적는 길 (0066 의 문을 덮습니다) ──────────────────────
-- ⚠️⚠️ **보낸 것으로 통째로 덮는 문이 아닙니다** — 0066 은 보낸 칸만
--    고칩니다. 그래서 `p ? 'photo'` 로 **보냈는지**를 보고 갈립니다:
--    안 보내면 그대로 두고, 빈 글자를 보내면 **지웁니다**(0069 의
--    모델명과 같은 결 — `coalesce` 로 받으면 지울 수가 없습니다).
create or replace function save_course_photo(p jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare v_role app_role := my_role(); v_id uuid; v_photo text; v_n int;
begin
  if coalesce(v_role::text,'') not in ('staff','admin') then
    raise exception '골프장 사진은 운영자만 고칠 수 있습니다';
  end if;
  v_id := nullif(p->>'id','')::uuid;
  if v_id is null then raise exception '어느 골프장인지 알려 주세요'; end if;
  if not (p ? 'photo') then raise exception '사진 경로를 보내 주세요'; end if;

  v_photo := nullif(btrim(coalesce(p->>'photo','')), '');
  update course set photo = v_photo, updated_at = now() where id = v_id;
  get diagnostics v_n = row_count;
  -- ⚠️ 0줄이면 **거절합니다** — 조용히 끝내면 기록에 "바꿨다" 가 남는데
  --    아무 일도 안 일어난 것입니다(0054 의 그 자리).
  if v_n = 0 then raise exception '그 골프장을 찾을 수 없습니다'; end if;

  insert into audit_log (by_user, what, obj, note)
  values (auth.uid(), 'save_course_photo', v_id::text,
          case when v_photo is null then '사진을 뺐습니다' else '사진을 적었습니다' end);
end $$;
revoke all on function save_course_photo(jsonb) from public;
grant execute on function save_course_photo(jsonb) to authenticated;

-- ── ③ 공개 보기 (0060 → 0066 → **0081**) ───────────────────────────
-- ⚠️⚠️⚠️ **`drop view` 를 쓰지 않습니다** — `v_teetime_count` 가 이 보기
--    위에 서 있어서 지우려 하면 `cannot drop view … because other objects
--    depend on it` 으로 멈춥니다(0060 이 밟은 그 자리). `create or
--    replace` 는 **칸을 맨 뒤에 더하는 것**은 됩니다.
-- ⚠️⚠️ **0066 의 정의를 그대로 베끼고 한 칸만 더합니다** — 0066 이
--    "기억으로 다시 썼다가 셋을 빠뜨렸다" 고 적어 둔 자리입니다.
create or replace view v_teetime_open as
  select t.id, t.provider_id, p.name as provider_name,
         t.kind, t.region, t.course, t.play_at, t.tee_at, t.holes,
         t.slots, t.green_fee,
         coalesce(nullif(btrim(coalesce(t.tel, '')), ''), p.tel) as tel,
         t.note, t.created_at,
         t.slots - (select coalesce(sum(b.people), 0) from teebook b
                     where b.tee_id = t.id
                       and b.state in ('applied','confirmed')) as left_n,
         (select count(*) from teebook b
           where b.tee_id = t.id and b.state = 'confirmed') as confirmed_n,
         t.course_id,
         (select c.slug from course c
           where c.id = t.course_id and c.state <> 'hidden') as course_slug,
         -- ── 0081 이 더한 하나 ────────────────────────────────
         -- ⚠️ 가려진 골프장의 사진은 **안 냅니다**(slug 와 같은 조건입니다)
         (select c.photo from course c
           where c.id = t.course_id and c.state <> 'hidden') as photo
    from teetime t
    join provider p on p.id = t.provider_id
   where t.state = 'open'
     and t.play_at >= kst_today()
     and p.listed = true
     and p.is_test = false
     and p.state = 'approved';
grant select on v_teetime_open to anon, authenticated;

-- ── ④ 골프장 공개 보기 (0066 → **0081**) ───────────────────────────
-- ⚠️⚠️ `v_course_count` 가 이 보기 위에 서 있으므로 여기서도 `drop view`
--    를 쓰지 않습니다 — `create or replace` 로 **맨 뒤에** 한 칸만 더합니다.
-- ⚠️ 사진은 **공개 자산**입니다(공개 버킷 · 주소만 알면 누구나 엽니다) —
--    그래서 공개 보기에 있는 것이 맞습니다. 운영자 화면이 지금 값을
--    미리 채우려면 읽을 길이 있어야 합니다(없으면 저장할 때마다 빈 칸을
--    보게 되고, 그건 「만들어 놓고 안 쓰는 칸」입니다).
create or replace view v_course_public as
  select c.id, c.slug, c.kind, c.name, c.region, c.gu,
         c.addr, c.addr_road, c.tel, c.holes, c.biz_kind, c.site_url,
         c.lat, c.lng, c.state, c.updated_at,
         (select s.source_id from course_source s
           where s.course_id = c.id order by s.created_at limit 1) as source_id,
         (select max(s.as_of) from course_source s where s.course_id = c.id) as as_of,
         -- ── 0081 이 더한 하나 ────────────────────────────────
         c.photo
    from course c
   where c.state <> 'hidden';
grant select on v_course_public to anon, authenticated;

insert into schema_version (n, name) values (81, '0081_course_photo')
on conflict (n) do nothing;
