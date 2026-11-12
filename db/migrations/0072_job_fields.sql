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
