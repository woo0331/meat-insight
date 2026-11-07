-- ════════════════════════════════════════════════════════════════════
-- 0066 — 전국 골프장 · 연습장 **마스터** (데이터 수집 지시서 작업 3)
--
-- 왜 이것이 먼저인가
--   부킹 · 조인 · 여행 · 회원권 **넷이 전부 골프장을 가리키는데**,
--   0060 까지는 골프장이 `teetime.course` 의 **자유 글자**였습니다.
--   그래서 "같은 골프장인데 다른 이름으로 올라온 티타임" 을 묶을 수 없고,
--   골프장별 화면도 만들 수 없었습니다.
--
-- ⚠️⚠️⚠️ **지어낸 시설을 한 줄도 넣지 않습니다.** 이 파일은 **표와 문만**
--   만듭니다. 줄을 채우는 것은 `tools/fetch-courses.js` 로 **공식 출처에서
--   실제로 받은 자료**뿐이고, 그 기록은 `data/staging/source_manifest.csv`
--   에 SHA256 과 함께 남습니다 (절대 규칙 1 · 표시광고법 제3조).
--
-- ⚠️⚠️⚠️ **`id` 와 `slug` 를 가릅니다** (지시서 작업 2).
--     id    안 바뀌는 안쪽 번호 (uuid) — 다른 표가 이것을 가리킵니다
--     slug  주소에 쓰는 글자 — **바뀔 수 있습니다** (운영자가 고칩니다)
--   `provider` 는 id 가 곧 slug 라 상호가 바뀌면 주소가 깨집니다. 골프장은
--   수천 곳이 될 자리라 같은 실수를 되풀이하지 않습니다.
--
-- ⚠️⚠️ **폐업을 지우지 않습니다** (`state = 'closed'`). 지우면 "원래 없던
--   곳" 이 되어 되살릴 근거가 사라지고, 다음 수집 때 새 줄로 또 들어옵니다.
--
-- ⚠️⚠️ **출처를 반드시 적습니다** (`course_source`). 어느 공공자료의 몇 번
--   줄에서 왔는지가 없으면 그 자료는 "우리가 적은 것" 과 구별되지 않습니다.
--   한 골프장이 여러 출처에서 올 수 있어 **표를 갈랐습니다**.
--
-- ⚠️⚠️⚠️ **제휴가 필요한 것은 이 표에 안 담습니다** (지시서 작업 5) —
--   실시간 잔여 티타임 · 그린피 · 회원권 호가 · 상품 재고는 **공식 제휴
--   피드**가 있어야 하는 값입니다. 공개 자료에 없는 것을 이 표에 칸으로
--   만들어 두면 누군가 그 칸을 채우고, 그 순간 지어낸 값이 손님 화면에
--   나갑니다. 그래서 **칸을 아예 안 만듭니다.**
--
-- ⚠️⚠️ **좌표는 null 이 기본입니다.** 공공 인허가 자료의 좌표는 EPSG:5174 ·
--   2097 처럼 좌표계가 섞여 있어, 확인 전에는 `tools/clean-courses.js` 가
--   비워 둡니다. 틀린 좌표로 지도에 찍으면 손님을 엉뚱한 곳으로 보냅니다.
--
-- 되돌아갔는지 보는 법
--   select count(*) from information_schema.tables where table_name = 'course';        -- 1
--   select count(*) from information_schema.views  where table_name = 'v_course_public'; -- 1
--   select pg_get_viewdef('v_teetime_open'::regclass) ilike '%course_id%';             -- t
-- ════════════════════════════════════════════════════════════════════


begin;


-- ── ⓪ 이름 정규화 — **규칙은 여기 한 곳** ──────────────────────
-- ⚠️⚠️⚠️ 처음에 이 규칙을 JS(tools/clean-courses.js)와 SQL 두 곳에 두었다가
--   잡았습니다 — JS 는 "컨트리클럽→cc" 를 하고 SQL 은 안 해서, 들여온
--   `name_norm` 과 트리거가 세는 값이 **조용히 달라집니다**. 그러면 티타임이
--   마스터에 영원히 안 이어지고 **에러도 안 납니다**.
-- ⚠️ 그래서 `course.name_norm` 은 **generated 칸**입니다 — 사람이 넣을 수
--   없고 DB 가 이 함수로 셉니다. 규칙이 둘이 될 수 없습니다.
create or replace function course_norm(p text) returns text
language sql immutable as $$
  select lower(regexp_replace(
           regexp_replace(
             regexp_replace(
               regexp_replace(coalesce(p,''),
                 '\(주\)|\(유\)|\(재\)|\(사\)|주식회사|유한회사|재단법인|사단법인', '', 'g'),
               '컨트리클럽|컨트리 클럽', 'cc', 'g'),
             '골프클럽|골프 클럽', 'gc', 'g'),
           '[[:space:]·.,''"()_-]', '', 'g'))
$$;
revoke all on function course_norm(text) from public;


-- ── ① 들여온 묶음 (어느 파일을 언제 넣었나) ─────────────────────────
-- ⚠️ import 는 **멱등**이어야 합니다 — 같은 파일을 두 번 넣어도 줄이
--    늘지 않게 `course_source` 에 unique 를 겁니다.
create table if not exists import_batch (
  id           uuid primary key default gen_random_uuid(),
  source_id    text not null check (btrim(source_id) <> ''),
  file_name    text not null,
  sha256       text not null check (char_length(sha256) = 64),
  http_status  int,
  license      text,
  data_as_of   date,
  rows_raw     int not null default 0,
  rows_ok      int not null default 0,
  rows_skipped int not null default 0,
  note         text,
  by_user      uuid references auth.users(id) on delete set null,
  at           timestamptz not null default now()
);
create unique index if not exists import_batch_sha_uq on import_batch (source_id, sha256);


-- ── ② 골프장 · 연습장 마스터 ────────────────────────────────────
create table if not exists course (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null,
  kind        text not null check (kind in ('golf','range')),
  name        text not null check (char_length(btrim(name)) between 2 and 80),
  name_norm   text generated always as (course_norm(name)) stored,
  region      text not null check (btrim(region) <> ''),
  gu          text,
  addr        text,
  addr_road   text,
  tel         text check (tel is null or char_length(btrim(tel)) between 7 and 20),
  holes       int  check (holes is null or holes between 1 and 72),
  biz_kind    text,
  site_url    text,
  -- ⚠️ 좌표는 **있을 때만** 채웁니다. 범위를 DB 가 다시 봅니다
  --    (한국 밖 좌표가 들어오면 지도가 엉뚱한 곳을 가리킵니다)
  lat         numeric(9,6) check (lat is null or lat between 32 and 40),
  lng         numeric(9,6) check (lng is null or lng between 124 and 132),
  state       text not null default 'open'
              check (state in ('open','closed','hidden')),
  state_why   text,
  state_at    timestamptz,
  state_by    uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  -- ⚠️ 가린 것은 **까닭이 반드시** 있습니다 (후기 · 게시판과 같은 규칙)
  constraint course_hidden_ck check (state <> 'hidden' or btrim(coalesce(state_why,'')) <> '')
);
create unique index if not exists course_slug_uq on course (lower(slug));
create index        if not exists course_region_ix on course (region, kind, state);
create index        if not exists course_norm_ix   on course (name_norm);


-- ── ③ 같은 골프장의 다른 이름 ───────────────────────────────────
-- ⚠️⚠️ 티타임은 **글자**로 올라옵니다(0060). 그 글자를 마스터에 잇는 길이
--    이것입니다. 자동 병합이 아니라 **운영자가 확인한 것만** 들어갑니다.
create table if not exists course_alias (
  id         uuid primary key default gen_random_uuid(),
  course_id  uuid not null references course(id) on delete cascade,
  alias      text not null check (btrim(alias) <> ''),
  alias_norm text not null check (btrim(alias_norm) <> ''),
  by_user    uuid references auth.users(id) on delete set null,
  at         timestamptz not null default now()
);
create unique index if not exists course_alias_uq on course_alias (alias_norm);


-- ── ④ 어느 출처의 어느 줄에서 왔나 ──────────────────────────────
create table if not exists course_source (
  id          uuid primary key default gen_random_uuid(),
  course_id   uuid not null references course(id) on delete cascade,
  source_id   text not null check (btrim(source_id) <> ''),
  src_key     text,
  status_raw  text,
  as_of       date,
  batch_id    uuid references import_batch(id) on delete set null,
  created_at  timestamptz not null default now()
);
-- ⚠️ 같은 출처의 같은 관리번호는 **한 줄**입니다 (두 번 넣어도 안 늘어납니다)
create unique index if not exists course_source_uq
  on course_source (source_id, src_key) where src_key is not null;


-- ── ⑤ 버린 줄 · 보류한 값 ───────────────────────────────────────
-- ⚠️ 왜 안 들어갔는지가 없으면 "그 골프장은 원래 없다" 로 읽힙니다.
create table if not exists import_row_issue (
  id        bigserial primary key,
  batch_id  uuid references import_batch(id) on delete cascade,
  source_id text not null,
  row_no    int,
  kind      text not null,
  detail    text,
  at        timestamptz not null default now()
);


-- ── ⑥ 티타임을 마스터에 잇는 칸 ─────────────────────────────────
-- ⚠️⚠️ **글자 칸(`teetime.course`)을 그대로 둡니다.** 마스터에 없는
--    골프장도 업체가 올릴 수 있어야 합니다 — 비면 글자를 그대로 보여 주고,
--    이어졌으면 골프장 화면으로 링크합니다.
alter table teetime add column if not exists course_id uuid
  references course(id) on delete set null;
create index if not exists teetime_course_ix on teetime (course_id);

-- 이름이 **정확히 맞을 때만** 잇습니다 — ⚠️⚠️⚠️ 비슷한 이름으로 추측해
-- 이으면 손님이 다른 골프장을 예약합니다. 못 찾으면 null 로 둡니다.

create or replace function teetime_link_course() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if new.course_id is not null then return new; end if;
  select c.id into v_id from course c
   where c.name_norm = course_norm(new.course) and c.state <> 'hidden'
   limit 1;
  if v_id is null then
    select a.course_id into v_id from course_alias a
     where a.alias_norm = course_norm(new.course) limit 1;
  end if;
  new.course_id := v_id;   -- ⚠️ 못 찾으면 null 그대로 (지어내지 않습니다)
  return new;
end $$;
revoke all on function teetime_link_course() from public;

drop trigger if exists teetime_link_course_t on teetime;
create trigger teetime_link_course_t
  before insert or update of course on teetime
  for each row execute function teetime_link_course();


-- ── ⑦ 공개로 읽는 길 — **보기 하나** ───────────────────────────
-- ⚠️⚠️ 보기는 RLS 를 지나지 않습니다 — 이 where 절이 자물쇠입니다.
--    가린 것(`hidden`)은 **손님에게 한 줄도 안 나갑니다.**
-- ⚠️ 폐업(`closed`)은 **냅니다** — 손님이 "여기 문 닫았나" 를 확인할 수
--    있어야 합니다. 다만 화면이 그 사실을 그 자리에서 말합니다.
drop view if exists v_course_count;
drop view if exists v_course_public;
create view v_course_public as
  select c.id, c.slug, c.kind, c.name, c.region, c.gu,
         c.addr, c.addr_road, c.tel, c.holes, c.biz_kind, c.site_url,
         c.lat, c.lng, c.state, c.updated_at,
         -- ⚠️ 출처와 기준일을 **같이** 냅니다 (지시서 작업 4 — 출처 표시)
         (select s.source_id from course_source s
           where s.course_id = c.id order by s.created_at limit 1) as source_id,
         (select max(s.as_of) from course_source s where s.course_id = c.id) as as_of
    from course c
   where c.state <> 'hidden';
grant select on v_course_public to anon, authenticated;

-- 집계 보기를 **목록 보기 위에** 세웁니다 — 0060 에서 배운 자리입니다.
-- 그러면 "집계와 목록이 다른 조건" 이 **구조적으로** 못 생깁니다.
create view v_course_count as
  select region, kind, count(*)::int as n
    from v_course_public
   where state = 'open'
   group by region, kind;
grant select on v_course_count to anon, authenticated;


-- ── ⑧ 문 — **운영자만** ─────────────────────────────────────────
-- ⚠️ 업체 · 손님은 골프장 마스터를 못 고칩니다. 업체가 제 골프장이라고
--    주장하는 길은 따로 세워야 하고(제휴 확인), 그 전에는 열지 않습니다.
create or replace function save_course(p jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_role app_role := my_role(); v_id uuid; v_slug text; v_name text;
begin
  if coalesce(v_role::text,'') not in ('staff','admin') then
    raise exception '골프장 정보는 운영자만 고칠 수 있습니다';
  end if;
  v_name := btrim(coalesce(p->>'name',''));
  if v_name = '' then raise exception '골프장 이름을 적어 주세요'; end if;
  v_slug := btrim(coalesce(p->>'slug',''));
  if v_slug = '' then raise exception '주소에 쓸 slug 를 적어 주세요'; end if;
  if v_slug !~ '^[a-z0-9][a-z0-9-]{1,60}$' then
    raise exception 'slug 는 영문 소문자 · 숫자 · 붙임표만 됩니다';
  end if;

  v_id := nullif(p->>'id','')::uuid;
  if v_id is null then
    insert into course (slug, kind, name, region, gu, addr, addr_road,
                        tel, holes, biz_kind, site_url, lat, lng)
    values (v_slug,
            coalesce(nullif(p->>'kind',''),'golf'),
            v_name,
            btrim(coalesce(p->>'region','')),
            nullif(btrim(coalesce(p->>'gu','')),''),
            nullif(btrim(coalesce(p->>'addr','')),''),
            nullif(btrim(coalesce(p->>'addr_road','')),''),
            nullif(btrim(coalesce(p->>'tel','')),''),
            nullif(p->>'holes','')::int,
            nullif(btrim(coalesce(p->>'biz_kind','')),''),
            nullif(btrim(coalesce(p->>'site_url','')),''),
            nullif(p->>'lat','')::numeric,
            nullif(p->>'lng','')::numeric)
    returning id into v_id;
  else
    -- ⚠️⚠️ **보낸 칸만 고칩니다** — 통째로 덮으면 화면이 칸을 빠뜨리는 날
    --    그 칸이 지워집니다 (`save_provider_self` 에서 겪은 자리).
    update course set
      slug      = v_slug,
      name      = v_name,
      kind      = coalesce(nullif(p->>'kind',''), kind),
      region    = coalesce(nullif(btrim(p->>'region'),''), region),
      gu        = case when p ? 'gu'        then nullif(btrim(p->>'gu'),'')        else gu end,
      addr      = case when p ? 'addr'      then nullif(btrim(p->>'addr'),'')      else addr end,
      addr_road = case when p ? 'addr_road' then nullif(btrim(p->>'addr_road'),'') else addr_road end,
      tel       = case when p ? 'tel'       then nullif(btrim(p->>'tel'),'')       else tel end,
      holes     = case when p ? 'holes'     then nullif(p->>'holes','')::int       else holes end,
      biz_kind  = case when p ? 'biz_kind'  then nullif(btrim(p->>'biz_kind'),'')  else biz_kind end,
      site_url  = case when p ? 'site_url'  then nullif(btrim(p->>'site_url'),'')  else site_url end,
      lat       = case when p ? 'lat'       then nullif(p->>'lat','')::numeric     else lat end,
      lng       = case when p ? 'lng'       then nullif(p->>'lng','')::numeric     else lng end,
      updated_at = now()
     where id = v_id;
    if not found then raise exception '그 골프장을 찾을 수 없습니다'; end if;
  end if;

  -- ⚠️ 기록에 **주소 · 전화를 안 담습니다** — 공개 자료라도 기록에 쌓아
  --    둘 까닭이 없고, audit_log 는 오래 남고 보는 사람도 넓습니다.
  insert into audit_log (by_user, by_role, obj, obj_id, to_state, why)
  values (auth.uid(), v_role, 'course', v_id::text, null, left(v_name, 40));
  return v_id;
end $$;
revoke all on function save_course(jsonb) from public;
grant execute on function save_course(jsonb) to authenticated;

-- 가리기 · 폐업 표시 — ⚠️ **지우는 문을 만들지 않습니다**
create or replace function move_course(p jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare v_role app_role := my_role(); v_to text; v_why text;
begin
  if coalesce(v_role::text,'') not in ('staff','admin') then
    raise exception '골프장 상태는 운영자만 바꿀 수 있습니다';
  end if;
  v_to  := btrim(coalesce(p->>'to',''));
  v_why := btrim(coalesce(p->>'why',''));
  if v_to not in ('open','closed','hidden') then
    raise exception '그런 상태는 없습니다';
  end if;
  -- ⚠️ 가릴 때는 **까닭이 반드시** — 까닭 없이 가릴 수 있으면 누가
  --    불평할 때마다 지워 주는 자리가 됩니다 (후기에서 배운 규칙).
  if v_to = 'hidden' and v_why = '' then
    raise exception '가리는 까닭을 적어 주세요';
  end if;
  update course set state = v_to,
                    state_why = nullif(v_why,''),
                    state_at = now(), state_by = auth.uid(), updated_at = now()
   where id = (p->>'id')::uuid;
  if not found then raise exception '그 골프장을 찾을 수 없습니다'; end if;

  insert into audit_log (by_user, by_role, obj, obj_id, to_state, why)
  values (auth.uid(), v_role, 'course', p->>'id', v_to, nullif(v_why,''));
end $$;
revoke all on function move_course(jsonb) from public;
grant execute on function move_course(jsonb) to authenticated;

-- 다른 이름 잇기 — ⚠️ 운영자가 **확인한 것만**
create or replace function link_course_alias(p jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare v_role app_role := my_role(); v_alias text;
begin
  if coalesce(v_role::text,'') not in ('staff','admin') then
    raise exception '골프장 이름 잇기는 운영자만 할 수 있습니다';
  end if;
  v_alias := btrim(coalesce(p->>'alias',''));
  if v_alias = '' then raise exception '이을 이름을 적어 주세요'; end if;
  insert into course_alias (course_id, alias, alias_norm, by_user)
  values ((p->>'course_id')::uuid, v_alias, course_norm(v_alias), auth.uid())
  on conflict (alias_norm) do nothing;

  -- 이미 올라온 티타임 가운데 **그 이름 그대로인 것만** 이어 줍니다
  update teetime set course_id = (p->>'course_id')::uuid
   where course_id is null and course_norm(course) = course_norm(v_alias);

  insert into audit_log (by_user, by_role, obj, obj_id, to_state, why)
  values (auth.uid(), v_role, 'course_alias', p->>'course_id', null, left(v_alias, 40));
end $$;
revoke all on function link_course_alias(jsonb) from public;
grant execute on function link_course_alias(jsonb) to authenticated;


-- ── ⑨ RLS — 표를 직접 읽거나 쓰는 길을 **안 엽니다** ───────────
alter table course           enable row level security;
alter table course_alias     enable row level security;
alter table course_source    enable row level security;
alter table import_batch     enable row level security;
alter table import_row_issue enable row level security;
-- ⚠️ 정책을 **하나도 안 둡니다** — 공개로 읽는 길은 보기 하나이고,
--    쓰는 길은 문 셋뿐입니다. 운영자도 표를 직접 안 읽습니다
--    (들여오기는 SQL 편집기에서 임자 권한으로 돕니다).
revoke all on table course           from anon, authenticated;
revoke all on table course_alias     from anon, authenticated;
revoke all on table course_source    from anon, authenticated;
revoke all on table import_batch     from anon, authenticated;
revoke all on table import_row_issue from anon, authenticated;


-- ── ⑩ 티타임 공개 보기에 골프장을 잇습니다 ─────────────────────
-- ⚠️⚠️ **칸을 늘리므로 지우고 다시 만듭니다** (`create or replace view`
--    는 칸을 못 늘립니다 — 0044 가 거기서 멈춘 자리입니다).
-- ⚠️ 집계 보기(`v_teetime_count`)가 이 보기 위에 서 있으므로 **먼저**
--    지웁니다. `cascade` 는 안 씁니다 (무엇이 같이 지워지는지 안 보입니다).
drop view if exists v_teetime_count;
drop view if exists v_teetime_open;
-- ⚠️⚠️⚠️ **0060 의 정의를 그대로 베끼고 두 칸만 더합니다.** 처음에 제가
--   기억으로 다시 썼다가 `tel` 합치기 · `left_n` · `confirmed_n` **셋을
--   빠뜨렸습니다** — 부킹 화면이 남은 자리를 못 세고 전화번호가 사라질
--   참이었고, `sql/teetime.js` 가 그 자리에서 잡았습니다.
--   ⚠️ 보기를 다시 만드는 날은 **앞 정의를 열어 보고** 더하기만 하세요.
create view v_teetime_open as
  select t.id, t.provider_id, p.name as provider_name,
         t.kind, t.region, t.course, t.play_at, t.tee_at, t.holes,
         t.slots, t.green_fee,
         -- 공개가 맞는 번호 둘 가운데 하나 (0060 그대로)
         coalesce(nullif(btrim(coalesce(t.tel, '')), ''), p.tel) as tel,
         t.note, t.created_at,
         t.slots - (select coalesce(sum(b.people), 0) from teebook b
                     where b.tee_id = t.id
                       and b.state in ('applied','confirmed')) as left_n,
         (select count(*) from teebook b
           where b.tee_id = t.id and b.state = 'confirmed') as confirmed_n,
         -- ── 0066 이 더한 둘 ──────────────────────────────────
         t.course_id,
         -- ⚠️ 마스터에 이어졌고 **가려지지 않았을 때만** slug 를 냅니다
         --    (없으면 null — 화면이 그것을 보고 링크를 걸지 말지 가릅니다)
         (select c.slug from course c
           where c.id = t.course_id and c.state <> 'hidden') as course_slug
    from teetime t
    join provider p on p.id = t.provider_id
   where t.state = 'open'
     and t.play_at >= kst_today()
     and p.listed = true
     and p.is_test = false
     and p.state = 'approved';
grant select on v_teetime_open to anon, authenticated;

-- ⚠️ 집계도 0060 의 칸 그대로입니다 (kind · left_n 을 빼면 메인 현황표와
--    부킹 화면이 조용히 틀립니다)
create view v_teetime_count as
  select kind, region, play_at, count(*)::int as n,
         sum(greatest(left_n, 0))::int as left_n
    from v_teetime_open
   group by kind, region, play_at;
grant select on v_teetime_count to anon, authenticated;


insert into schema_version (n, name) values (66, '0066_course')
  on conflict (n) do nothing;

commit;
