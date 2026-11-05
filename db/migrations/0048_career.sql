-- ════════════════════════════════════════════════════════════════════
-- 0048 — 골프 인력 · 비즈니스 (구인 · 구직 · 제휴)
-- ════════════════════════════════════════════════════════════════════
-- ⚠️⚠️⚠️ **왜 지금 만드는가** — 막다른 분류 셋 가운데 마지막입니다
--   (조인 0046 · 커뮤니티 0047 · 여기). `/cat/career` 를 누르면
--   하위분류 여섯 이름만 보고 끝이었습니다 — 구인 글을 올릴 자리도,
--   지원할 자리도 없었습니다. 절대 규칙 2.
--
-- ⚠️⚠️ **한 표로 셋을 받습니다** (`kind`) —
--     hire  사람을 구합니다 (골프장 · 연습장 · 아카데미 → 프로 · 캐디)
--     seek  일자리를 구합니다 (프로 · 캐디 → 업체)
--     biz   제휴 · B2B · 양도양수 (업체끼리)
--   표를 셋으로 가르면 목록 · 지원 · 신고 · 가리기를 세 벌 적게 되고,
--   한 벌만 고치는 날 둘이 다른 말을 합니다.
--   ⚠️ **하위분류 키 목록을 여기 박지 않습니다** — `js/data/catalog.js`
--   의 `cr-*` 와 어긋나는 날 화면은 보내는데 DB 가 거절합니다
--   (지역 키와 같은 자리 — 0046 의 region 주석).
--
-- ⚠️⚠️⚠️ **연락처는 0046 과 똑같이 다룹니다** (개인정보보호법 제17조
--   제2항). 구인 글에 번호를 적어 두면 **아무나 긁어 갑니다** — 그리고
--   구직자 번호는 더합니다 (이력이 붙은 개인정보입니다).
--     ① 공개 보기에 `contact` 칸이 **아예 없습니다**
--     ② 표의 칸 단위 GRANT 에서 뺐습니다
--     ③ 오가는 길은 보기 `v_job_contact` 하나이고, 그 where 절이
--        **수락된 짝**만 냅니다
--   ⚠️ 그리고 **수락만으로 열리지 않습니다** — 각자 제 것만 따로 열고
--   언제든 닫습니다 (`share_jobcontact`). 수락은 "이야기해 봅시다"
--   이지 "내 번호를 줘도 좋다" 가 아닙니다.
--
-- ⚠️⚠️ **업체 이름으로 올리는 것은 고르는 것입니다** (`as_pro`).
--   켜면 **승인된 · 검사용이 아닌** 업체여야 하고, 그때만 상호가
--   목록에 나옵니다. 끄면 다른 글과 같이 가린 이름(`김**`)입니다.
--   ⚠️ 보기가 **읽을 때 다시** 상태를 봅니다 — 정지된 업체의 상호는
--   그 순간부터 목록에서 빠집니다 (저장된 이름을 믿지 않습니다).
--
-- ⚠️ **지우지 않고 내립니다**(`dropped`). 운영자가 가릴 때는 **까닭이
--   반드시**(`hidden`) — 0047 과 같은 자리입니다.
--
-- ⚠️⚠️ **급여 · 조건을 지어내지 않습니다.** 비우면 화면에서 그 줄이
--   **줄째 빠집니다** (절대 규칙 2). "협의" 를 우리가 적어 넣지
--   않습니다 — 그것은 글쓴이가 할 말입니다.
--
-- 되돌아갔는지 보는 법
--   select 1 from pg_proc where proname = 'open_jobpost';   -- 있어야 합니다
--   select count(*) from information_schema.columns
--    where table_name = 'jobpost';                          -- 19 여야 합니다
-- ════════════════════════════════════════════════════════════════════
begin;

-- ════════════════════════════════════════════════════════════════════
-- ① 글 한 건
-- ════════════════════════════════════════════════════════════════════
create table if not exists jobpost (
  id          uuid primary key default gen_random_uuid(),
  by_user     uuid not null references auth.users(id) on delete cascade,
  -- ⚠️⚠️ **손님이 보낸 값으로 채우지 않습니다** — 문이 `my_provider()`
  --   에서 읽습니다. 보낸 값을 믿으면 아무나 남의 상호로 글을 올립니다.
  provider_id text references provider(id) on delete set null,
  kind        text not null check (kind in ('hire','seek','biz')),
  -- ⚠️ catalog.js 의 **하위** key (cr-coach · cr-caddy …). 목록을
  --   박지 않습니다 — 하위분류가 느는 날 두 곳이 어긋납니다.
  sub         text not null check (btrim(sub) <> ''),
  -- ⚠️ 지역 키는 js/data/regions.js 의 AM_REGIONS 와 **같은 글자**
  region      text not null check (btrim(region) <> ''),
  title       text not null check (char_length(btrim(title)) between 2 and 60),
  body        text not null check (char_length(btrim(body)) between 5 and 2000),
  -- 급여 · 조건 — 선택입니다 (비면 화면에서 줄째 빠집니다)
  pay         text check (pay is null or char_length(btrim(pay)) <= 60),
  terms       text check (terms is null or char_length(btrim(terms)) <= 200),
  -- 마감일 — 선택. ⚠️ 지나면 공개 보기에서 **저절로** 빠집니다
  close_at    date,
  -- open    받는 중
  -- closed  글쓴이가 마감했습니다 (사람을 구했거나 그만둠)
  -- dropped 글쓴이가 내렸습니다 ⚠️ 지우지 않습니다
  -- hidden  운영자가 가렸습니다 ⚠️ 까닭이 반드시 있습니다
  state       text not null default 'open'
              check (state in ('open','closed','dropped','hidden')),
  hidden_why  text,
  hidden_by   uuid references auth.users(id) on delete set null,
  hidden_at   timestamptz,
  -- ⚠️⚠️ **연락처는 여기 있지만 아무도 표에서 못 읽습니다** (④의 GRANT)
  contact     text not null check (btrim(contact) <> ''),
  -- ⚠️ 동의 **시각**을 받습니다. boolean 으로 두면 "언제 받았나" 를
  --   못 댑니다 (제15조 제2항을 따질 때 그것이 전부입니다).
  agree_at    timestamptz not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
-- ⚠️ 까닭 없이 가릴 수 없습니다 — 문에서도 막고 여기서도 봅니다
--   (문이 내려가는 날 이 줄이 남습니다)
do $$ begin
  alter table jobpost add constraint jobpost_hidden_ck
    check (state <> 'hidden' or btrim(coalesce(hidden_why,'')) <> '');
exception when duplicate_object then null; end $$;

create index if not exists jobpost_open_idx
  on jobpost (kind, created_at desc) where state = 'open';
create index if not exists jobpost_mine_idx on jobpost (by_user, created_at desc);
create index if not exists jobpost_sub_idx  on jobpost (sub) where state = 'open';

-- ════════════════════════════════════════════════════════════════════
-- ② 지원 · 제안 한 건
-- ════════════════════════════════════════════════════════════════════
create table if not exists jobapply (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references jobpost(id) on delete cascade,
  by_user    uuid not null references auth.users(id) on delete cascade,
  msg        text check (msg is null or char_length(btrim(msg)) <= 1000),
  contact    text not null check (btrim(contact) <> ''),
  -- applied  보냈습니다
  -- accepted 글쓴이가 받았습니다  ← 이때부터 **연락처를 열 수** 있습니다
  -- rejected 글쓴이가 거절했습니다
  -- canceled 보낸 사람이 거뒀습니다
  state      text not null default 'applied'
             check (state in ('applied','accepted','rejected','canceled')),
  agree_at   timestamptz not null,
  -- ⚠️⚠️⚠️ **수락만으로 연락처가 오가지 않습니다** (0046 과 같은 자리).
  --     host_share_at   글쓴이가 **제** 번호를 이 지원자에게 보여 줌
  --     guest_share_at  지원자가 **제** 번호를 글쓴이에게 보여 줌
  --   ⚠️ 한쪽만 눌러도 그쪽 것만 갑니다 (맞바꾸기를 강요하지 않습니다 —
  --   강요하면 "줘야 받는" 구조가 되어 사실상 강제 동의입니다).
  host_share_at  timestamptz,
  guest_share_at timestamptz,
  created_at timestamptz not null default now(),
  -- ⚠️ 한 글에 한 번만 — 안 막으면 한 사람이 같은 글에 백 번 넣습니다
  unique (post_id, by_user)
);
create index if not exists jobapply_post_idx on jobapply (post_id, created_at desc);
create index if not exists jobapply_mine_idx on jobapply (by_user, created_at desc);

-- ════════════════════════════════════════════════════════════════════
-- ③ 공개 보기 — ⚠️⚠️ **where 절이 자물쇠 그 자체입니다**
--   보기는 RLS 를 지나지 않습니다 (임자 권한으로 돕니다). 그래서
--   여기 담지 않은 칸은 **어떤 정책으로도** 새어 나가지 않습니다.
--   ⚠️ `contact` · `by_user` · `agree_at` 을 **안 담습니다**.
-- ════════════════════════════════════════════════════════════════════
drop view if exists v_job_open;
create view v_job_open as
  select j.id, j.kind, j.sub, j.region, j.title, j.body, j.pay, j.terms,
         j.close_at, j.created_at, j.updated_at,
         -- ⚠️ 이름은 **저장하지 않고 셉니다** (후기 · 커뮤니티와 같은 꼴)
         case
           when btrim(coalesce(ac.name, '')) = '' then '회원'
           else left(btrim(ac.name), 1) ||
                repeat('*', greatest(char_length(btrim(ac.name)) - 1, 1))
         end as who,
         -- ⚠️⚠️ **읽을 때 다시 봅니다** — 승인된 · 검사용이 아닌 업체의
         --   상호만 나옵니다. 정지되면 그 순간부터 빠집니다.
         --   ⚠️ 검사용 업체(0030)가 섞이면 없는 회사를 광고하는 것입니다.
         case when pv.id is not null and pv.state = 'approved'
                   and pv.is_test = false
              then pv.name end as pro_name,
         -- ⚠️ 지원 수는 칸에 저장하지 않고 **셉니다** (절대 규칙 1)
         (select count(*) from jobapply a
           where a.post_id = j.id and a.state in ('applied','accepted')) as apply_n
    from jobpost j
    left join account  ac on ac.id = j.by_user
    left join provider pv on pv.id = j.provider_id
   where j.state = 'open'
     and (j.close_at is null or j.close_at >= current_date);
grant select on v_job_open to anon, authenticated;

-- ⚠️⚠️⚠️ **연락처가 오가는 단 하나의 길입니다.**
--   ① 수락된 지원이어야 하고 ② 보는 사람이 그 둘 중 하나여야 하고
--   ③ **각자 열어 둔 것만** 나옵니다. 셋 다 where · case 에 있으므로
--   정책을 어떻게 쓰든 이 조건을 못 피합니다.
drop view if exists v_job_contact;
create view v_job_contact as
  select a.id as apply_id, a.post_id,
         j.by_user as post_owner, a.by_user as applicant,
         a.host_share_at, a.guest_share_at,
         case when a.host_share_at  is not null then j.contact end as post_contact,
         case when a.guest_share_at is not null then a.contact end as apply_contact
    from jobapply a
    join jobpost  j on j.id = a.post_id
   where a.state = 'accepted'
     and (auth.uid() = j.by_user or auth.uid() = a.by_user);
grant select on v_job_contact to authenticated;

-- ════════════════════════════════════════════════════════════════════
-- ④ 자물쇠 — RLS 로 **줄**을, GRANT 로 **칸**을
--   ⚠️⚠️ 둘을 따로 둡니다. 하나만 보고 "막혔다" 고 읽으면 다른 하나가
--   장식인지 알 수 없습니다.
-- ════════════════════════════════════════════════════════════════════
alter table jobpost  enable row level security;
alter table jobapply enable row level security;

drop policy if exists jobpost_mine on jobpost;
create policy jobpost_mine on jobpost for select
  using (by_user = auth.uid());
drop policy if exists jobpost_staff on jobpost;
create policy jobpost_staff on jobpost for select
  using (my_role() in ('staff','admin'));

drop policy if exists jobapply_mine on jobapply;
create policy jobapply_mine on jobapply for select
  using (by_user = auth.uid());
-- 내 글에 들어온 지원 — ⚠️ 연락처 칸은 아래 GRANT 가 막습니다
drop policy if exists jobapply_owner on jobapply;
create policy jobapply_owner on jobapply for select
  using (exists (select 1 from jobpost j
                  where j.id = jobapply.post_id and j.by_user = auth.uid()));
drop policy if exists jobapply_staff on jobapply;
create policy jobapply_staff on jobapply for select
  using (my_role() in ('staff','admin'));

-- ⚠️⚠️⚠️ **칸 단위 GRANT — `contact` 와 `agree_at` 을 빼고 줍니다.**
--   정책이 줄을 보여 줘도 이 칸들은 **읽히지 않습니다.**
--   ⚠️ 쓰기(insert · update · delete)는 **한 줄도 주지 않습니다** —
--   들어오는 길은 아래 문 여섯뿐입니다.
grant select (id, by_user, provider_id, kind, sub, region, title, body,
              pay, terms, close_at, state, hidden_why, hidden_at,
              created_at, updated_at)             on jobpost  to authenticated;
grant select (id, post_id, by_user, msg, state, created_at,
              host_share_at, guest_share_at)      on jobapply to authenticated;

-- ════════════════════════════════════════════════════════════════════
-- ⑤ 문 — 글을 올립니다
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
  v_aspro   boolean := coalesce((p->>'as_pro')::boolean, false);
  v_close   date;
  v_pv      text;
  v_id      uuid;
begin
  if v_uid is null then
    raise exception '로그인이 필요합니다';
  end if;
  if v_kind is null or v_kind not in ('hire','seek','biz') then
    raise exception '구인 · 구직 · 제휴 가운데 하나를 골라 주세요';
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

  -- ⚠️ 동의 시각 — 미래이거나 하루 넘게 지난 것은 받지 않습니다
  if p->>'agree_at' is null then
    raise exception '개인정보 수집 · 이용 동의가 필요합니다';
  end if;
  if (p->>'agree_at')::timestamptz > now() + interval '5 minutes'
     or (p->>'agree_at')::timestamptz < now() - interval '1 day' then
    raise exception '동의 시각이 올바르지 않습니다';
  end if;

  -- 마감일 — 선택입니다
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

  -- ⚠️⚠️ **업체 이름으로 올리는 것은 고르는 것입니다.** 켰으면
  --   승인된 · 검사용이 아닌 업체여야 합니다 — 보낸 값은 안 믿고
  --   `my_provider()` 에서 읽습니다.
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

  -- ⚠️⚠️ **쏟아붓기 막기.** 한 사람이 글을 백 개 올리면 목록이 통째로
  --   쓸모없어집니다. 열려 있는 글은 **한 번에 열**까지.
  --   ⚠️ 마감 · 내린 글은 안 셉니다 (마감하고 다시 올리는 것은 정상).
  if (select count(*) from jobpost
       where by_user = v_uid and state = 'open') >= 10 then
    raise exception '올려 두신 글이 열입니다. 먼저 마감해 주세요';
  end if;
  if (select count(*) from jobpost
       where by_user = v_uid and created_at > now() - interval '1 day') >= 20 then
    raise exception '오늘은 더 올릴 수 없습니다 (하루 스무 개)';
  end if;

  insert into jobpost (by_user, provider_id, kind, sub, region, title, body,
                       pay, terms, close_at, contact, agree_at)
  values (v_uid, v_pv, v_kind, v_sub, v_region, v_title, v_body,
          v_pay, v_terms, v_close, v_contact, (p->>'agree_at')::timestamptz)
  returning id into v_id;
  return v_id;
end $$;
grant execute on function open_jobpost(jsonb) to authenticated;

-- ════════════════════════════════════════════════════════════════════
-- ⑥ 문 — 지원 · 제안을 보냅니다
-- ════════════════════════════════════════════════════════════════════
create or replace function apply_jobpost(p jsonb)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_uid     uuid := auth.uid();
  v_post    uuid := nullif(btrim(coalesce(p->>'post_id','')), '')::uuid;
  v_msg     text := nullif(btrim(coalesce(p->>'msg','')), '');
  v_contact text := nullif(btrim(coalesce(p->>'contact','')), '');
  v_owner   uuid;
  v_state   text;
  v_close   date;
  v_id      uuid;
begin
  if v_uid is null then
    raise exception '로그인이 필요합니다';
  end if;
  if v_post is null then
    raise exception '어느 글인지 알 수 없습니다';
  end if;
  select j.by_user, j.state, j.close_at into v_owner, v_state, v_close
    from jobpost j where j.id = v_post;
  if v_owner is null then
    raise exception '그런 글이 없습니다';
  end if;
  -- ⚠️ 제 글에는 못 넣습니다 (후기에서 겪은 자리와 같습니다)
  if coalesce(v_owner = v_uid, false) then
    raise exception '올리신 글에는 지원하실 수 없습니다';
  end if;
  if v_state <> 'open' then
    raise exception '마감된 글입니다';
  end if;
  if v_close is not null and v_close < current_date then
    raise exception '마감일이 지난 글입니다';
  end if;
  if v_contact is null then
    raise exception '연락처를 적어 주세요';
  end if;
  if char_length(v_contact) > 100 then
    raise exception '연락처가 너무 깁니다';
  end if;
  if v_msg is not null and char_length(v_msg) > 1000 then
    raise exception '하실 말씀이 너무 깁니다 (1000자)';
  end if;
  if p->>'agree_at' is null then
    raise exception '개인정보 수집 · 이용 동의가 필요합니다';
  end if;
  if (p->>'agree_at')::timestamptz > now() + interval '5 minutes'
     or (p->>'agree_at')::timestamptz < now() - interval '1 day' then
    raise exception '동의 시각이 올바르지 않습니다';
  end if;

  -- ⚠️ 쏟아붓기 — 하루 스무 건까지
  if (select count(*) from jobapply
       where by_user = v_uid and created_at > now() - interval '1 day') >= 20 then
    raise exception '오늘은 더 보낼 수 없습니다 (하루 스무 건)';
  end if;

  -- ⚠️⚠️ 같은 글에 두 번 — unique 가 막지만 **말이 알아들을 수 없습니다**
  --   (중복 키 오류가 손님 화면에 그대로 나갑니다). 여기서 먼저 봅니다.
  if exists (select 1 from jobapply
              where post_id = v_post and by_user = v_uid) then
    raise exception '이미 보내셨습니다 — 내 정보에서 보실 수 있습니다';
  end if;

  insert into jobapply (post_id, by_user, msg, contact, agree_at)
  values (v_post, v_uid, v_msg, v_contact, (p->>'agree_at')::timestamptz)
  returning id into v_id;
  return v_id;
end $$;
grant execute on function apply_jobpost(jsonb) to authenticated;

-- ════════════════════════════════════════════════════════════════════
-- ⑦ 문 — 지원을 수락 · 거절 · 거둡니다
-- ════════════════════════════════════════════════════════════════════
create or replace function move_jobapply(p jsonb)
returns text
language plpgsql security definer set search_path = public as $$
declare
  v_uid   uuid := auth.uid();
  v_id    uuid := nullif(btrim(coalesce(p->>'id','')), '')::uuid;
  v_to    text := nullif(btrim(coalesce(p->>'state','')), '');
  v_owner uuid;
  v_by    uuid;
  v_st    text;
  v_pst   text;
begin
  if v_uid is null then raise exception '로그인이 필요합니다'; end if;
  if v_id is null then raise exception '어느 지원인지 알 수 없습니다'; end if;
  if v_to not in ('accepted','rejected','canceled') then
    raise exception '옮길 수 없는 상태입니다';
  end if;

  -- ⚠️⚠️ **글 줄을 먼저 잠급니다.** 안 잠그면 둘을 동시에 수락할 때
  --   둘 다 "아직 괜찮다" 로 읽습니다 (0046 에서 겪은 자리).
  select j.by_user, j.state, a.by_user, a.state
    into v_owner, v_pst, v_by, v_st
    from jobapply a join jobpost j on j.id = a.post_id
   where a.id = v_id
     for update of j;
  if v_by is null then raise exception '그런 지원이 없습니다'; end if;

  if v_to = 'canceled' then
    -- 거두는 것은 **보낸 사람만**
    if not coalesce(v_by = v_uid, false) then
      raise exception '보내신 분만 거두실 수 있습니다';
    end if;
    if v_st <> 'applied' then
      raise exception '이미 처리된 지원입니다';
    end if;
    update jobapply set state = 'canceled' where id = v_id;
    return 'canceled';
  end if;

  -- 수락 · 거절은 **글쓴이만**
  if not coalesce(v_owner = v_uid, false) then
    raise exception '올리신 분만 수락 · 거절하실 수 있습니다';
  end if;
  if v_st <> 'applied' then
    raise exception '이미 처리된 지원입니다';
  end if;
  if v_pst <> 'open' then
    raise exception '마감된 글입니다';
  end if;
  update jobapply set state = v_to where id = v_id;
  return v_to;
end $$;
grant execute on function move_jobapply(jsonb) to authenticated;

-- ════════════════════════════════════════════════════════════════════
-- ⑧ 문 — 글을 마감 · 내립니다 (운영자는 가립니다)
-- ════════════════════════════════════════════════════════════════════
create or replace function move_jobpost(p jsonb)
returns text
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_id  uuid := nullif(btrim(coalesce(p->>'id','')), '')::uuid;
  v_to  text := nullif(btrim(coalesce(p->>'state','')), '');
  v_why text := nullif(btrim(coalesce(p->>'why','')), '');
  v_by  uuid;
  v_st  text;
begin
  if v_uid is null then raise exception '로그인이 필요합니다'; end if;
  if v_id is null then raise exception '어느 글인지 알 수 없습니다'; end if;
  select by_user, state into v_by, v_st from jobpost where id = v_id for update;
  if v_by is null then raise exception '그런 글이 없습니다'; end if;

  if v_to in ('closed','dropped') then
    -- 마감 · 내리기는 **글쓴이만**
    if not coalesce(v_by = v_uid, false) then
      raise exception '올리신 분만 마감 · 내리실 수 있습니다';
    end if;
    if v_st = 'hidden' then
      raise exception '운영자가 가린 글은 글쓴이가 옮길 수 없습니다';
    end if;
    if v_st = v_to then
      raise exception '이미 그 상태입니다';
    end if;
    if v_st = 'dropped' then
      raise exception '이미 내려간 글입니다';
    end if;
    update jobpost set state = v_to, updated_at = now() where id = v_id;
    return v_to;
  elsif v_to = 'hidden' then
    -- 가리는 것은 **운영자만** — 까닭이 반드시 있어야 합니다
    if not coalesce(my_role() in ('staff','admin'), false) then
      raise exception '가리는 것은 운영자만 할 수 있습니다';
    end if;
    if v_why is null or char_length(v_why) < 5 then
      raise exception '가리는 까닭을 다섯 글자 이상 적어 주세요';
    end if;
    update jobpost set state = 'hidden', hidden_why = v_why, hidden_by = v_uid,
                       hidden_at = now(), updated_at = now() where id = v_id;
    -- ⚠️ 감사 기록에 **글 내용을 넣지 않습니다** — 번호로 찾아갑니다
    insert into audit_log (by_user, by_role, obj, obj_id, to_state, data)
    values (v_uid, my_role(), 'jobpost', v_id::text, 'hidden',
            jsonb_build_object('why_len', char_length(v_why)));
    return 'hidden';
  end if;
  raise exception '옮길 수 없는 상태입니다';
end $$;
grant execute on function move_jobpost(jsonb) to authenticated;

-- ════════════════════════════════════════════════════════════════════
-- ⑨ 문 — 올린 글을 고칩니다
--   ⚠️⚠️ **분류 · 갈래는 여기서 못 바꿉니다** — 바꾸면 들어온 지원이
--   전혀 다른 자리로 옮겨 갑니다 (커뮤니티의 cat 과 같은 자리).
--   ⚠️ 운영자가 **가린** 글은 글쓴이도 못 고칩니다 (고쳐서 가린 뜻을
--   지울 수 없습니다).
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
begin
  if v_uid is null then raise exception '로그인이 필요합니다'; end if;
  if v_id is null then raise exception '어느 글인지 알 수 없습니다'; end if;
  select by_user, state into v_by, v_st from jobpost where id = v_id for update;
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
  -- ⚠️⚠️ **연락처는 보낸 것으로 덮습니다** — 양식이 그 칸을 빠뜨리면
  --   지워집니다. 그래서 비워 보내는 것은 거절합니다
  --   (`save_provider_self` 에서 겪은 자리).
  if v_contact is null then
    raise exception '연락처를 적어 주세요';
  end if;
  if char_length(v_contact) > 100 then
    raise exception '연락처가 너무 깁니다';
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
         close_at = v_close, contact = v_contact, updated_at = now()
   where id = v_id;
  return v_id;
end $$;
grant execute on function edit_jobpost(jsonb) to authenticated;

-- ════════════════════════════════════════════════════════════════════
-- ⑩ 문 — **제** 연락처를 엽니다 · 닫습니다
--   ⚠️⚠️⚠️ 제17조 제2항의 "별도 동의" 가 여기입니다. 수락과 **다른
--   결정**이고, 각자 **제 것만** 열고 **언제든 닫습니다**(철회권).
-- ════════════════════════════════════════════════════════════════════
create or replace function share_jobcontact(p jsonb)
returns text
language plpgsql security definer set search_path = public as $$
declare
  v_uid   uuid := auth.uid();
  v_id    uuid := nullif(btrim(coalesce(p->>'id','')), '')::uuid;
  v_on    boolean := coalesce((p->>'on')::boolean, false);
  v_owner uuid;
  v_by    uuid;
  v_st    text;
begin
  if v_uid is null then raise exception '로그인이 필요합니다'; end if;
  if v_id is null then raise exception '어느 지원인지 알 수 없습니다'; end if;
  select j.by_user, a.by_user, a.state into v_owner, v_by, v_st
    from jobapply a join jobpost j on j.id = a.post_id
   where a.id = v_id for update of a;
  if v_by is null then raise exception '그런 지원이 없습니다'; end if;
  -- ⚠️ 수락된 뒤에만 — 수락 전에 열면 "누구에게 주는지" 가 정해지기
  --   전에 주는 것입니다 (제17조 제2항).
  if v_st <> 'accepted' then
    raise exception '수락된 뒤에 열 수 있습니다';
  end if;

  if coalesce(v_owner = v_uid, false) then
    update jobapply
       set host_share_at = case when v_on then now() else null end
     where id = v_id;
    return case when v_on then 'host-on' else 'host-off' end;
  elsif coalesce(v_by = v_uid, false) then
    update jobapply
       set guest_share_at = case when v_on then now() else null end
     where id = v_id;
    return case when v_on then 'guest-on' else 'guest-off' end;
  end if;
  raise exception '그 지원의 당사자만 열 수 있습니다';
end $$;
grant execute on function share_jobcontact(jsonb) to authenticated;

-- ════════════════════════════════════════════════════════════════════
-- ⑪ 신고 — ⚠️ **새 표를 만들지 않습니다.** `report` 에 칸을 더합니다
-- ════════════════════════════════════════════════════════════════════
alter table report add column if not exists jobpost_id uuid references jobpost(id) on delete cascade;
alter table report drop constraint if exists report_target_ck;
alter table report add  constraint report_target_ck check (
  request_id is not null or provider_id is not null or review_id is not null
  or joinroom_id is not null or cq_id is not null or ca_id is not null
  or jobpost_id is not null);


-- ⚠️⚠️ **open_report 를 갈아 끼웁니다** (0047 → 0048). 0047 의 본문을
--   **그대로 꺼내** 네 군데만 끼웠습니다 — 손으로 다시 쓰면 0040 ·
--   0046 · 0047 이 하던 일이 조용히 사라집니다.
create or replace function open_report(p jsonb)
  returns uuid language plpgsql security definer
  set search_path = public as $$
declare
  v_me   uuid := auth.uid();
  v_kind text := coalesce(nullif(btrim(p->>'kind'), ''), 'abuse');
  v_req  uuid := nullif(btrim(coalesce(p->>'request', '')), '')::uuid;
  v_pv   text := nullif(btrim(coalesce(p->>'provider', '')), '');
  v_rv   uuid := nullif(btrim(coalesce(p->>'review', '')), '')::uuid;
  -- ⚠️ 0046 — 조인 자리도 신고할 수 있습니다 (새 표를 만들지 않습니다)
  v_jr   uuid := nullif(btrim(coalesce(p->>'joinroom', '')), '')::uuid;
  -- ⚠️ 0047 — 커뮤니티 질문 · 답변도 신고할 수 있습니다
  v_cq   uuid := nullif(btrim(coalesce(p->>'question', '')), '')::uuid;
  v_ca   uuid := nullif(btrim(coalesce(p->>'answer', '')), '')::uuid;
  -- ⚠️ 0048 — 구인 · 구직 · 제휴 글도 신고할 수 있습니다
  v_jp   uuid := nullif(btrim(coalesce(p->>'jobpost', '')), '')::uuid;
  v_body text := btrim(coalesce(p->>'body', ''));
  v_id   uuid;
  v_dup  int;
begin
  if v_me is null then raise exception '신고는 로그인한 뒤에 하실 수 있습니다'; end if;
  if v_kind not in ('abuse','dispute') then
    raise exception '신고 · 분쟁 중 하나로 적어 주세요';
  end if;
  if v_req is null and v_pv is null and v_rv is null and v_jr is null
     and v_cq is null and v_ca is null and v_jp is null then
    raise exception '무엇에 대한 것인지 적어 주세요 (요청 · 업체 · 후기 · 조인 · 글 가운데 하나)';
  end if;
  if char_length(v_body) < 5 then
    raise exception '무슨 일이 있었는지 다섯 글자 이상 적어 주세요';
  end if;
  if char_length(v_body) > 2000 then
    raise exception '신고 내용은 이천 글자까지입니다';
  end if;

  -- ⚠️⚠️ **분쟁은 그 요청의 당사자만** 엽니다. 아무나 "저 거래가
  --   이상합니다" 라고 열 수 있으면 분쟁이 아니라 신고입니다.
  if v_kind = 'dispute' then
    if v_req is null then raise exception '분쟁은 어느 요청인지 적어야 합니다'; end if;
    if not (coalesce(is_my_request(v_req), false)
            or coalesce(exists (select 1 from assignment a
                                 where a.request_id = v_req
                                   and a.provider_id = my_provider()), false)
            or coalesce(my_role() in ('staff','admin'), false)) then
      raise exception '그 거래의 당사자만 분쟁을 열 수 있습니다';
    end if;
  end if;

  -- ⚠️⚠️ **같은 것을 두 번 열지 않습니다.** 누르는 손이 미끄러지면
  --   같은 신고가 둘이 되고, 운영자는 그것을 두 번 읽습니다.
  select count(*) into v_dup from report
   where by_user = v_me and kind = v_kind and state in ('open','reviewing')
     and request_id is not distinct from v_req
     and provider_id is not distinct from v_pv
     and review_id is not distinct from v_rv
     and joinroom_id is not distinct from v_jr
     and cq_id is not distinct from v_cq
     and ca_id is not distinct from v_ca
     and jobpost_id is not distinct from v_jp;
  if v_dup > 0 then
    raise exception '같은 건으로 이미 접수된 것이 있습니다 — 운영자가 보고 있습니다';
  end if;

  insert into report (kind, request_id, provider_id, review_id, joinroom_id,
                      cq_id, ca_id, jobpost_id, by_user, body)
  values (v_kind, v_req, v_pv, v_rv, v_jr, v_cq, v_ca, v_jp, v_me, v_body)
  returning id into v_id;

  -- ⚠️ 감사 기록에 **신고 본문을 넣지 않습니다** — audit_log 는 오래
  --   남고 보는 사람도 넓습니다. 번호로 찾아갑니다.
  insert into audit_log (by_user, by_role, obj, obj_id, to_state, data)
  values (v_me, my_role(), 'report', v_id::text, 'open',
          jsonb_build_object('kind', v_kind));
  return v_id;
end $$;

revoke all on function open_report(jsonb) from public;
grant execute on function open_report(jsonb) to authenticated;

insert into schema_version (n, name) values (48, '0048_career')
  on conflict (n) do nothing;

commit;
