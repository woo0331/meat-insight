-- ════════════════════════════════════════════════════════════════════
-- 0045 — 고객센터 문의 접수 (4차 지시서 §11) · 입점 신청의 사업장 주소 (§9)
--
-- ⚠️⚠️ **왜 필요한가.** 고객센터에 "문의 접수" 가 없었습니다. 담을 표도
--   없고, 사업자 정보 여덟 칸이 비어 있어 전화 · 이메일도 적을 수
--   없었습니다 (전자상거래법 제10조 — 없는 연락처를 지어낼 수 없습니다).
--   신고 · 분쟁(0040)은 "어느 요청 · 어느 업체" 를 가리켜야 열리므로
--   **그냥 묻고 싶은 것**을 받을 자리가 한 곳도 없었습니다.
--
-- ⚠️⚠️⚠️ **로그인 없이도 받습니다 — 그래서 자물쇠를 더 겁니다.**
--   0040 은 "익명 신고를 받으면 경쟁사가 하루 백 건을 넣는다" 고 적고
--   로그인을 요구했습니다. 문의는 **로그인 전에 묻는 것**이 보통이라
--   그럴 수가 없습니다. 대신 ① 연락 받을 곳을 반드시 받고 ② 같은
--   연락처로 10분에 한 건 ③ 하루 열 건으로 막습니다.
--   ⚠️ 번호를 바꿔 가며 넣는 것은 **못 막습니다** (IP 를 받지 않습니다 —
--   받기 시작하면 그날부터 처리 항목이 하나 늘어 방침을 같이 고쳐야
--   합니다). 막는 척하지 않고 그 사실을 여기 적어 둡니다.
--
-- ⚠️⚠️ **개인정보보호법 제15조 제2항** — 수집 항목 · 이용 목적 · 보유
--   기간을 동의받는 그 자리에서 같이 보여 줍니다. 화면이 그것을 그리고,
--   여기서는 **동의 시각**을 받아 둡니다 (boolean 으로 두면 "언제
--   받았나" 를 못 댑니다).
--
-- ⚠️ 쓰기 정책도 GRANT 도 주지 않습니다 — 들어오는 길은 문 둘뿐입니다.
--
-- 되돌아갔는지 보는 법
--   select count(*) from information_schema.columns
--    where table_name = 'provider_apply' and column_name = 'addr';   -- 1 이어야 합니다
--   select 1 from pg_proc where proname = 'open_inquiry';            -- 있어야 합니다
-- ════════════════════════════════════════════════════════════════════

-- ════════════════════════════════════════════════════════════════════
-- ① 입점 신청의 **사업장 주소** (§9 "업체 가입 정보" 목록)
--
-- ⚠️ 받기만 하고 쓰지 않던 칸을 만들지 않습니다 — 화면이 같은 날
--   그 칸을 냅니다 (js/applyform.js).
-- ════════════════════════════════════════════════════════════════════
alter table provider_apply add column if not exists addr text;

-- ⚠️⚠️ **make_apply 를 갈아 끼웁니다** (0027 → 0045). 0027 을 다시 붙여
--   넣으면 이 줄이 **조용히 내려갑니다** — 에러가 안 납니다.
--   내려갔는지 보는 법:
--     select pg_get_functiondef('make_apply(jsonb)'::regprocedure)
--       like '%v_addr%';   -- false 면 0027 이 덮은 것입니다
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
  if length(v_digits) < 9 or length(v_digits) > 11 then
    raise exception '연락처를 다시 봐 주세요 — 숫자 아홉에서 열한 자리입니다';
  end if;

  if array_length(v_svc, 1) is null then
    raise exception '하시는 일을 하나 이상 골라 주세요';
  end if;
  if array_length(v_svc, 1) > 20 then
    raise exception '고르신 항목이 너무 많습니다';
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

  if exists (
    select 1 from provider_apply
     where regexp_replace(tel, '[^0-9]', '', 'g') = v_digits
       and created_at > now() - interval '10 minutes'
  ) then
    raise exception '방금 같은 번호로 신청이 들어왔습니다 — 잠시 뒤에 해 주세요';
  end if;

  v_no := 'AP-' || to_char(now() at time zone 'Asia/Seoul', 'YYMMDD') || '-' ||
          upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 4));

  insert into provider_apply
    (no, company, brn, name, tel, email, region, addr, services, note, agree_at)
  values
    (v_no, v_company, v_brn, v_name, v_tel, v_email, v_region, v_addr, v_svc, v_note,
     (p->>'agree_at')::timestamptz);

  -- ⚠️ 감사 기록에 **성함 · 연락처 · 주소를 넣지 않습니다.**
  insert into audit_log (by_user, by_role, obj, obj_id, to_state, why, data)
  values (auth.uid(), my_role(), 'provider_apply', v_no, 'new', '입점 신청 접수',
          jsonb_build_object('services', v_svc, 'region', v_region));

  return v_no;
end $$;

revoke all on function make_apply(jsonb) from public;
grant execute on function make_apply(jsonb) to anon, authenticated;


-- ════════════════════════════════════════════════════════════════════
-- ② 문의 — 표
-- ════════════════════════════════════════════════════════════════════
create table if not exists inquiry (
  id          uuid primary key default gen_random_uuid(),
  -- 접수번호 — ⚠️ 손님에게 돌려주는 값이라 **저장된 뒤에만** 나갑니다
  no          text not null unique,
  -- use     이용 중 막히는 곳
  -- biz     업체 · 제휴 문의
  -- privacy 개인정보 (열람 · 정정 · 삭제 · 동의 철회)
  -- etc     그 밖
  kind        text not null check (kind in ('use','biz','privacy','etc')),
  body        text not null,
  -- 연락 받을 곳 — ⚠️ 로그인 안 하셔도 넣으시므로 받습니다
  name        text,
  tel         text,
  email       text,
  by_user     uuid references auth.users(id) on delete set null,
  -- ⚠️⚠️ 동의를 **시각으로** 남깁니다 (제15조)
  agree_at    timestamptz not null,
  state       text not null default 'open'
              check (state in ('open','reviewing','answered','closed')),
  answer      text,
  answered_at timestamptz,
  answered_by uuid references auth.users(id) on delete set null,
  memo        text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint inquiry_body_ck check (char_length(btrim(body)) between 5 and 2000),
  -- ⚠️⚠️ **답했다고 두려면 답이 있어야 합니다.** 문에서도 받고 여기서도
  --   봅니다 — 문이 내려가는 날 이 줄이 남습니다.
  constraint inquiry_answer_ck check (
    state <> 'answered' or btrim(coalesce(answer,'')) <> ''),
  -- ⚠️⚠️ **답을 보낼 길이 없으면 받지 않습니다.** 로그인하셨으면 계정으로,
  --   아니면 전화나 메일 가운데 하나는 있어야 합니다.
  constraint inquiry_reach_ck check (
    by_user is not null
    or btrim(coalesce(tel,'')) <> ''
    or btrim(coalesce(email,'')) <> '')
);
create index if not exists inquiry_state_idx on inquiry (state, created_at desc);
create index if not exists inquiry_tel_idx
  on inquiry (regexp_replace(coalesce(tel,''), '[^0-9]', '', 'g'), created_at desc);

alter table inquiry enable row level security;

-- ⚠️⚠️ **제 문의만 봅니다.** 남의 문의가 보이면 그 자체가 유출입니다
--   (무엇을 물었는지 · 연락처).
drop policy if exists inquiry_mine on inquiry;
create policy inquiry_mine on inquiry for select
  using (by_user = auth.uid());

drop policy if exists inquiry_staff on inquiry;
create policy inquiry_staff on inquiry for select
  using (my_role() in ('staff','admin'));

-- ⚠️ 쓰기 정책을 일부러 안 만들었습니다 — 문 둘만 엽니다.
grant select on inquiry to authenticated;


-- ════════════════════════════════════════════════════════════════════
-- ③ 문 — 문의를 넣습니다 (로그인 없이도)
-- ════════════════════════════════════════════════════════════════════
create or replace function open_inquiry(p jsonb)
  returns text language plpgsql security definer
  set search_path = public as $$
declare
  v_me    uuid := auth.uid();
  v_kind  text := coalesce(nullif(btrim(p->>'kind'), ''), 'etc');
  v_body  text := btrim(coalesce(p->>'body', ''));
  v_name  text := nullif(btrim(coalesce(p->>'name', '')), '');
  v_tel   text := nullif(btrim(coalesce(p->>'tel', '')), '');
  v_email text := nullif(btrim(coalesce(p->>'email', '')), '');
  v_dig   text;
  v_no    text;
begin
  -- ⚠️ 자물쇠마다 **다른 말**로 거절합니다 — 같은 말이면 하나를 빼 봐도
  --    다른 것이 먼저 막아 엉뚱한 까닭으로 통과합니다.
  if v_kind not in ('use','biz','privacy','etc') then
    raise exception '문의 종류를 골라 주세요';
  end if;
  if char_length(v_body) < 5 then
    raise exception '무엇이 궁금하신지 다섯 글자 이상 적어 주세요';
  end if;
  if char_length(v_body) > 2000 then
    raise exception '문의 내용은 이천 글자까지입니다';
  end if;
  if v_name is not null and length(v_name) > 40 then
    raise exception '성함이 너무 깁니다';
  end if;

  if v_tel is not null then
    v_dig := regexp_replace(v_tel, '[^0-9]', '', 'g');
    if length(v_dig) < 9 or length(v_dig) > 11 then
      raise exception '연락처를 다시 봐 주세요 — 숫자 아홉에서 열한 자리입니다';
    end if;
  end if;
  if v_email is not null and v_email !~ '^[^@[:space:]]+@[^@[:space:].]+[.][^@[:space:]]+$' then
    raise exception '메일 주소를 다시 봐 주세요';
  end if;

  -- ⚠️⚠️ **답을 보낼 길이 없으면 받지 않습니다.**
  if v_me is null and v_tel is null and v_email is null then
    raise exception '답을 보내 드릴 전화번호나 메일 주소를 적어 주세요';
  end if;

  -- ⚠️⚠️ 동의 시각 (제15조) — make_apply 와 같은 규칙입니다
  if (p->>'agree_at') is null then
    raise exception '수집 · 이용 동의가 필요합니다';
  end if;
  if (p->>'agree_at')::timestamptz > now() + interval '5 minutes' then
    raise exception '동의 시각이 미래입니다';
  end if;
  if (p->>'agree_at')::timestamptz < now() - interval '1 day' then
    raise exception '동의가 오래되었습니다 — 다시 한 번 눌러 주세요';
  end if;

  -- ⚠️⚠️⚠️ **쏟아붓기 막기 — 두 겹입니다.** 로그인한 분은 계정으로,
  --   아니면 전화 숫자로 셉니다. 자물쇠마다 **다른 말**로 거절합니다.
  if v_me is not null then
    if exists (select 1 from inquiry
                where by_user = v_me and created_at > now() - interval '10 minutes') then
      raise exception '방금 문의를 넣으셨습니다 — 잠시 뒤에 해 주세요';
    end if;
    if (select count(*) from inquiry
         where by_user = v_me and created_at > now() - interval '24 hours') >= 10 then
      raise exception '하루에 보내실 수 있는 문의 수를 넘었습니다';
    end if;
  elsif v_dig is not null then
    if exists (select 1 from inquiry
                where regexp_replace(coalesce(tel,''), '[^0-9]', '', 'g') = v_dig
                  and created_at > now() - interval '10 minutes') then
      raise exception '방금 같은 번호로 문의가 들어왔습니다 — 잠시 뒤에 해 주세요';
    end if;
    if (select count(*) from inquiry
         where regexp_replace(coalesce(tel,''), '[^0-9]', '', 'g') = v_dig
           and created_at > now() - interval '24 hours') >= 10 then
      raise exception '하루에 보내실 수 있는 문의 수를 넘었습니다';
    end if;
  end if;

  v_no := 'IQ-' || to_char(now() at time zone 'Asia/Seoul', 'YYMMDD') || '-' ||
          upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 4));

  insert into inquiry (no, kind, body, name, tel, email, by_user, agree_at)
  values (v_no, v_kind, v_body, v_name, v_tel, v_email, v_me,
          (p->>'agree_at')::timestamptz);

  -- ⚠️ 감사 기록에 **성함 · 연락처 · 내용을 넣지 않습니다** — 접수번호로
  --   찾아가면 됩니다. audit_log 는 오래 남고 보는 사람도 넓습니다.
  insert into audit_log (by_user, by_role, obj, obj_id, to_state, why, data)
  values (v_me, my_role(), 'inquiry', v_no, 'open', '문의 접수',
          jsonb_build_object('kind', v_kind));

  return v_no;
end $$;

revoke all on function open_inquiry(jsonb) from public;
grant execute on function open_inquiry(jsonb) to anon, authenticated;


-- ════════════════════════════════════════════════════════════════════
-- ④ 문 — 운영자가 문의를 옮깁니다
--
-- ⚠️⚠️ **답했다고 두려면 답을 같이 받습니다.** 까닭 없이 닫을 수 있으면
--   답하지 않고 닫는 자리가 되고, 그러면 접수가 있으나 마나입니다.
-- ════════════════════════════════════════════════════════════════════
create or replace function move_inquiry(p jsonb)
  returns void language plpgsql security definer
  set search_path = public as $$
declare
  v_me   uuid := auth.uid();
  v_role app_role := my_role();
  v_id   uuid := nullif(btrim(coalesce(p->>'id', '')), '')::uuid;
  v_to   text := btrim(coalesce(p->>'to', ''));
  v_ans  text := nullif(btrim(coalesce(p->>'answer', '')), '');
  r      inquiry%rowtype;
begin
  if v_me is null then raise exception '변경자를 알 수 없습니다'; end if;
  -- ⚠️ coalesce 로 NULL 을 땅에 내려놓습니다 — my_role() 이 NULL 이면
  --    not (NULL) 이 NULL 이라 if 가 **안 걸립니다** (0034 에서 겪었습니다).
  if not coalesce(v_role in ('staff','admin'), false) then
    raise exception '문의 처리는 운영자만 할 수 있습니다';
  end if;
  if v_id is null then raise exception '어느 문의인지 적어 주세요'; end if;
  if v_to not in ('reviewing','answered','closed') then
    raise exception '문의는 확인 중 · 답변함 · 닫음으로만 옮깁니다';
  end if;

  select * into r from inquiry where id = v_id;
  if not found then raise exception '그런 문의가 없습니다'; end if;
  if r.state = v_to then raise exception '이미 %입니다', v_to; end if;
  if r.state = 'closed' then
    raise exception '닫힌 문의는 다시 옮길 수 없습니다';
  end if;
  if v_to = 'answered' and v_ans is null then
    raise exception '무엇이라고 답하셨는지 적어 주세요';
  end if;
  if v_ans is not null and length(v_ans) > 2000 then
    raise exception '답변이 너무 깁니다';
  end if;

  update inquiry
     set state       = v_to,
         answer      = coalesce(v_ans, answer),
         answered_at = case when v_to = 'answered' then now() else answered_at end,
         answered_by = case when v_to = 'answered' then v_me else answered_by end,
         memo        = coalesce(nullif(btrim(coalesce(p->>'memo','')), ''), memo),
         updated_at  = now()
   where id = v_id;

  -- ⚠️ 답 글자는 감사 기록에 넣지 않습니다 (손님 · 운영자가 쓴 글입니다)
  insert into audit_log (by_user, by_role, obj, obj_id, to_state, why, data)
  values (v_me, v_role, 'inquiry', r.no, v_to, '문의 상태 변경',
          jsonb_build_object('kind', r.kind));
end $$;

revoke all on function move_inquiry(jsonb) from public;
grant execute on function move_inquiry(jsonb) to authenticated;
