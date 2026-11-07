-- ════════════════════════════════════════════════════════════════════
-- 0061 — 회원이 올리는 **구합니다** (업체 · 회원이 답합니다)
--
-- 붙는 분류 여섯: 레슨 · 연습장 · 용품 마켓 · 피팅 · 수리 · 여행 · 부킹
--   그 여섯은 **업체만** 등록하는 자리였습니다. 업체가 0곳인 동안은
--   손님이 할 수 있는 일이 매칭 요청 하나뿐이고, 화면은 "등록된 업체가
--   없습니다" 만 말했습니다. 회원이 **먼저 올리고** 업체가 찾아오게
--   합니다.
--
-- ⚠️⚠️⚠️ **`/match`(매칭 요청)와 다릅니다 — 섞으면 안 됩니다.**
--     매칭 요청  운영자만 봅니다 · 배정할 때 상호를 알리고 다시 동의를
--                받아 그 업체에만 넘깁니다 (제17조 제2항)
--     구합니다   **누구나 봅니다** · 글에 연락처를 안 담고, 받아들인 뒤
--                **각자 제 것만** 엽니다
--   둘은 다른 길이고 화면이 그 차이를 **그 자리에서** 말해야 합니다.
--   안 적으면 손님이 둘 중 무엇을 써야 할지 모릅니다.
--
-- ⚠️⚠️⚠️ **0056(중고) · 0048(인력)을 그대로 베꼈습니다.** 짜임새가
--   같습니다 — 글을 올리고 · 상대가 말을 걸고 · 받아들이면 **각자 제
--   연락처만** 따로 엽니다. 새로 설계하면 "받아들이면 서로 보이게"
--   같은 자리를 다시 틀립니다 (0046 에서 지시서가 짚어 준 그 자리).
--
-- ⚠️⚠️⚠️ **연락처는 받아들이기만으로 안 열립니다** (제17조 제2항).
--   받아들이는 것은 "얘기해 봅시다" 이지 "내 번호를 줘도 좋다" 가
--   아닙니다. 각자 **제 것만** 열고 **언제든 닫습니다**(철회권) —
--   닫을 때는 동의 시각을 **안 받습니다**(받으면 철회를 막는 꼴입니다).
--
-- ⚠️⚠️ **답은 공개가 아닙니다.** 목록에는 **답이 몇 개인지만** 나오고
--   내용은 **올린 분과 답한 본인**만 봅니다 (0056 의 문의와 같습니다).
--   공개로 두면 답에 섞여 들어온 연락처가 그대로 공개됩니다.
--
-- ⚠️⚠️ **예산은 필수가 아닙니다** — 강요하면 지어내서 적습니다
--   (작업 기억의 그 줄). 비면 화면에서 **줄째 빠집니다**.
--
-- ⚠️ 분류 키 · 하위 키 · 지역 키를 **여기 박지 않습니다** — 박으면
--   분류가 바뀌는 날 두 곳이 어긋나고, 그때 화면은 보내는데 DB 가
--   거절합니다 (`make_request` 가 하위 예순둘을 모르는 그 까닭).
--
-- ⚠️ 보유 기간은 `js/data/site.js` 의 `wantedKeep` 입니다 (운영 정책이라
--   DB 에 안 박습니다). 비면 화면이 **양식을 안 엽니다** — 법이 보여
--   주라는 것을 안 보여 주고 동의를 받을 수는 없습니다 (제15조 제2항).
--
-- ⚠️ 신고는 **새 표를 안 만들고** `report` 에 `wanted_id` 를 더합니다.
--   체인: open_report (0040 → 0046 → 0047 → 0048 → 0056 → 0060 → **0061**)
-- ════════════════════════════════════════════════════════════════════

begin;

-- ════════════════════════════════════════════════════════════════════
-- ① 구합니다 글 한 장
-- ════════════════════════════════════════════════════════════════════
create table if not exists wanted (
  id         uuid primary key default gen_random_uuid(),
  by_user    uuid not null references auth.users(id) on delete cascade,
  -- ⚠️ 분류 키 — `js/data/catalog.js` 의 AM_CATS 와 **같은 글자**입니다
  --   (lesson · range · market · fitting · travel · booking). 목록을
  --   박지 않습니다.
  cat        text not null check (btrim(cat) <> ''),
  -- ⚠️ 하위는 **고르셔도 되고 안 고르셔도 됩니다** — 좁혀 적으면 업체가
  --   찾기 쉽고, 모르시면 비우는 쪽이 맞습니다 (모르는 것을 고르게
  --   하면 틀린 하위가 쌓입니다).
  sub        text check (sub is null or btrim(sub) <> ''),
  -- ⚠️ 지역 키도 `js/data/regions.js` 의 AM_REGIONS 와 같은 글자입니다
  region     text not null check (btrim(region) <> ''),
  title      text not null check (char_length(btrim(title)) between 2 and 60),
  body       text not null check (char_length(btrim(body)) between 5 and 2000),
  -- ⚠️⚠️ **예산은 비워 두실 수 있습니다** (null = 안 적음). 0 도 받지만
  --   그건 "무료로 해 주실 분" 이라는 뜻이고 "안 적음" 과 다릅니다 —
  --   그래서 화면에서 `||` 를 쓰면 0 이 사라집니다 (작업 기억의 그 자리).
  budget     int check (budget is null or budget between 0 and 100000000),
  -- 언제 필요하신지 — ⚠️ **글자입니다** ("주말 오전" · "12월 중순").
  --   날짜 칸으로 두면 "아무 때나" 를 적을 자리가 없어집니다.
  when_txt   text check (when_txt is null or char_length(btrim(when_txt)) <= 60),
  -- open   찾고 있습니다
  -- done   구했습니다 (글쓴이가 눌렀습니다)
  -- closed 글쓴이가 내렸습니다
  -- hidden 운영자가 가렸습니다 — ⚠️ 까닭이 반드시 있습니다 (아래 check)
  state      text not null default 'open'
             check (state in ('open','done','closed','hidden')),
  -- ⚠️⚠️ **연락처는 여기 있지만 아무도 표에서 못 읽습니다** (④의 GRANT).
  --   오가는 길은 v_wanted_contact 하나입니다.
  contact    text not null check (btrim(contact) <> ''),
  -- ⚠️ 동의 **시각**을 받습니다 (boolean 으로 두면 "언제 받았나" 를
  --   못 댑니다 — 제15조 제2항을 따질 때 그것이 전부입니다)
  agree_at   timestamptz not null,
  hidden_why text,
  hidden_by  uuid references auth.users(id) on delete set null,
  hidden_at  timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- ⚠️⚠️ 까닭 없이 가릴 수 없습니다 — **문이 내려가도 이 줄이 남습니다**
  constraint wanted_hidden_ck
    check (state <> 'hidden' or btrim(coalesce(hidden_why,'')) <> '')
);
create index if not exists wanted_open_idx
  on wanted (state, created_at desc) where state = 'open';
create index if not exists wanted_mine_idx on wanted (by_user, created_at desc);
create index if not exists wanted_cat_idx
  on wanted (cat, region) where state = 'open';

-- ════════════════════════════════════════════════════════════════════
-- ② 답 한 건 — "제가 해 드릴 수 있습니다"
-- ════════════════════════════════════════════════════════════════════
create table if not exists wantedreply (
  id         uuid primary key default gen_random_uuid(),
  w_id       uuid not null references wanted(id) on delete cascade,
  by_user    uuid not null references auth.users(id) on delete cascade,
  -- ⚠️⚠️ **업체 이름(상호)으로 답하는 것은 고르는 것입니다** (0048 의
  --   as_pro 와 같습니다). 승인된 · 검사용이 아닌 업체만 되고, 보기가
  --   **읽을 때 다시** 상태를 봅니다 — 정지되면 그 순간 빠집니다.
  --   ⚠️ 비우면 **개인으로** 답하는 것입니다.
  as_pro     text references provider(id) on delete set null,
  body       text not null check (char_length(btrim(body)) between 5 and 500),
  contact    text not null check (btrim(contact) <> ''),
  -- replied  보냈습니다
  -- accepted 올린 분이 받아들였습니다 ← 이때부터 **연락처를 고를 수** 있습니다
  -- rejected 올린 분이 거절했습니다
  -- canceled 답한 분이 거뒀습니다
  state      text not null default 'replied'
             check (state in ('replied','accepted','rejected','canceled')),
  agree_at   timestamptz not null,
  -- ⚠️⚠️⚠️ **각자 제 것만** (0046 의 host/guest · 0056 의 seller/buyer 와
  --   같은 자리입니다)
  --     owner_share_at   올린 분이 **제** 번호를 이 분에게 보여 줌
  --     helper_share_at  답한 분이 **제** 번호를 올린 분에게 보여 줌
  owner_share_at  timestamptz,
  helper_share_at timestamptz,
  created_at timestamptz not null default now(),
  -- ⚠️ 한 글에 한 번만 — 안 막으면 한 사람이 같은 글에 백 번 넣습니다
  unique (w_id, by_user)
);
create index if not exists wantedreply_w_idx
  on wantedreply (w_id, created_at desc);
create index if not exists wantedreply_mine_idx
  on wantedreply (by_user, created_at desc);

-- ════════════════════════════════════════════════════════════════════
-- ③ 공개 목록 — ⚠️ **보기의 where 절이 자물쇠 그 자체입니다**
--   보기는 RLS 를 지나지 않습니다 (임자 권한으로 돕니다). 그래서 여기
--   담지 않은 칸은 **어떤 정책으로도 새어 나가지 않습니다.**
--   ⚠️⚠️ `contact` 와 `by_user` 를 **담지 않습니다** — 글은 공개지만
--   누가 올렸는지와 연락처는 공개가 아닙니다 (후기 · 조인 · 중고와
--   같은 꼴).
-- ════════════════════════════════════════════════════════════════════
drop view if exists v_wanted_open;
create view v_wanted_open as
  select w.id, w.cat, w.sub, w.region, w.title, w.body, w.budget, w.when_txt,
         w.created_at,
         -- ⚠️ 칸에 저장하지 않고 **셉니다** (절대 규칙 1 — 숫자로 들고
         --   있으면 누군가 그 칸에 고쳐 적습니다)
         -- ⚠️⚠️ **개수만 공개입니다.** 답의 **내용**은 올린 분과 답한
         --   본인만 봅니다 — 공개로 두면 답에 섞여 들어온 연락처가
         --   그대로 공개됩니다.
         (select count(*) from wantedreply r
           where r.w_id = w.id and r.state = 'replied') as reply_n
    from wanted w
   where w.state = 'open';
grant select on v_wanted_open to anon, authenticated;

-- ⚠️⚠️ 올린 분이 **받은 답**을 읽는 자리 — 연락처는 **안 담습니다**
--   (그것은 v_wanted_contact 하나로만 갑니다).
--   ⚠️ 업체 이름으로 답한 것은 **읽을 때 다시** 상태를 봅니다 —
--   승인된 · 검사용이 아닌 · 정지되지 않은 업체만 상호가 나옵니다
--   (0048 의 as_pro · 0055 의 광고 보기와 **같은 셋**입니다).
drop view if exists v_wanted_reply;
create view v_wanted_reply as
  select r.id, r.w_id, r.by_user, r.body, r.state, r.created_at,
         r.owner_share_at, r.helper_share_at,
         case when p.id is not null then p.name end as pro_name,
         -- ⚠️ 개인으로 답한 분은 **가린 성함**입니다 (본이름은 안 냅니다 —
         --   화면에서 가리면 이미 브라우저까지 온 것입니다 · 0052)
         case when p.id is null then
           left(coalesce(nullif(btrim(a.name), ''), '회원'), 1) ||
           repeat('*', greatest(char_length(coalesce(nullif(btrim(a.name), ''), '회원')) - 1, 0))
         end as who,
         w.by_user as owner
    from wantedreply r
    join wanted  w on w.id = r.w_id
    left join account a on a.id = r.by_user
    left join provider p on p.id = r.as_pro
                        and p.listed = true
                        and p.is_test = false
                        and p.state = 'approved'
   where auth.uid() = w.by_user or auth.uid() = r.by_user;
grant select on v_wanted_reply to authenticated;

-- ⚠️⚠️⚠️ **연락처가 오가는 단 하나의 길입니다.**
--   ① 받아들인 답이어야 하고 ② 보는 사람이 그 둘 중 하나여야 합니다.
--   둘 다 where 절에 있으므로 정책을 어떻게 쓰든 이 조건을 못 피합니다.
drop view if exists v_wanted_contact;
create view v_wanted_contact as
  select r.id as reply_id, r.w_id,
         w.by_user as owner, r.by_user as helper,
         r.owner_share_at, r.helper_share_at,
         -- ⚠️⚠️⚠️ **받아들이기만으로는 둘 다 null 입니다** (제17조 제2항)
         case when r.owner_share_at  is not null then w.contact end as owner_contact,
         case when r.helper_share_at is not null then r.contact end as helper_contact
    from wantedreply r
    join wanted      w on w.id = r.w_id
   where r.state = 'accepted'
     and (auth.uid() = w.by_user or auth.uid() = r.by_user);
grant select on v_wanted_contact to authenticated;

-- ════════════════════════════════════════════════════════════════════
-- ④ 자물쇠 — RLS 로 **줄**을, GRANT 로 **칸**을 막습니다
--   ⚠️⚠️ 둘을 따로 둡니다. 하나만 보고 "막혔다" 고 읽으면 다른 하나가
--   장식인지 알 수 없습니다 (GRANT 를 잠깐 열어 RLS 가 막는지 봅니다).
-- ════════════════════════════════════════════════════════════════════
alter table wanted      enable row level security;
alter table wantedreply enable row level security;

drop policy if exists wanted_mine on wanted;
create policy wanted_mine on wanted for select
  using (by_user = auth.uid());
drop policy if exists wanted_staff on wanted;
create policy wanted_staff on wanted for select
  using (my_role() in ('staff','admin'));

drop policy if exists wantedreply_mine on wantedreply;
create policy wantedreply_mine on wantedreply for select
  using (by_user = auth.uid());
-- 내 글에 들어온 답 — ⚠️ 연락처 칸은 아래 GRANT 가 막습니다
drop policy if exists wantedreply_owner on wantedreply;
create policy wantedreply_owner on wantedreply for select
  using (exists (select 1 from wanted w
                  where w.id = wantedreply.w_id and w.by_user = auth.uid()));
drop policy if exists wantedreply_staff on wantedreply;
create policy wantedreply_staff on wantedreply for select
  using (my_role() in ('staff','admin'));

-- ⚠️⚠️⚠️ **칸 단위 GRANT — `contact` 와 `agree_at` 을 빼고 줍니다.**
--   정책이 줄을 보여 줘도 이 칸들은 **읽히지 않습니다.**
--   ⚠️ 쓰기(insert · update · delete)는 **한 줄도 주지 않습니다** —
--   들어오는 길은 아래 문 일곱뿐입니다.
--   ⚠️⚠️ 안 준 칸을 `where` 절에 쓰면 0줄이 아니라 **질의가 통째로
--   거절**됩니다 (0050 · 0052 · 0056 에서 세 번 밟은 자리입니다).
grant select (id, by_user, cat, sub, region, title, body, budget, when_txt,
              state, hidden_why, hidden_at, created_at, updated_at)
                                   on wanted      to authenticated;
grant select (id, w_id, by_user, as_pro, body, state, created_at,
              owner_share_at, helper_share_at)
                                   on wantedreply to authenticated;

-- ════════════════════════════════════════════════════════════════════
-- ⑤ 문 — 구합니다 글을 올립니다
-- ════════════════════════════════════════════════════════════════════
create or replace function open_wanted(p jsonb)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_uid     uuid := auth.uid();
  v_cat     text := nullif(btrim(coalesce(p->>'cat','')), '');
  v_sub     text := nullif(btrim(coalesce(p->>'sub','')), '');
  v_region  text := nullif(btrim(coalesce(p->>'region','')), '');
  v_title   text := nullif(btrim(coalesce(p->>'title','')), '');
  v_body    text := nullif(btrim(coalesce(p->>'body','')), '');
  v_when    text := nullif(btrim(coalesce(p->>'when_txt','')), '');
  v_contact text := nullif(btrim(coalesce(p->>'contact','')), '');
  v_budget  int;
  v_id      uuid;
begin
  if v_uid is null then
    raise exception '로그인이 필요합니다';
  end if;
  if v_cat is null then
    raise exception '분류가 없습니다';
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
  if v_when is not null and char_length(v_when) > 60 then
    raise exception '언제 필요하신지가 너무 깁니다 (60자)';
  end if;

  -- ⚠️⚠️ **예산은 비워 두실 수 있습니다** — 강요하면 지어내서 적습니다.
  --   빈 글자는 "안 적음"(null)이고 0 은 "무료로 해 주실 분" 입니다.
  --   둘은 다른 뜻이라 섞지 않습니다.
  if p->>'budget' is not null and btrim(p->>'budget') <> '' then
    begin
      v_budget := btrim(p->>'budget')::int;
    exception when others then
      raise exception '예산은 숫자로 적어 주세요';
    end;
    if v_budget < 0 or v_budget > 100000000 then
      raise exception '예산이 올바르지 않습니다';
    end if;
  end if;

  if v_contact is null then
    raise exception '연락처를 적어 주세요';
  end if;
  if length(v_contact) > 100 then
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

  -- ⚠️⚠️ **쏟아붓기 막기.** 한 사람이 백 개를 올리면 목록이 통째로
  --   쓸모없어집니다. 찾고 있는 것은 **한 번에 열**까지.
  --   ⚠️ 내린 것 · 구한 것은 안 셉니다 (정상입니다).
  if (select count(*) from wanted
       where by_user = v_uid and state = 'open') >= 10 then
    raise exception '찾고 계신 글이 열입니다. 먼저 정리해 주세요';
  end if;
  if (select count(*) from wanted
       where by_user = v_uid and created_at > now() - interval '1 day') >= 20 then
    raise exception '오늘은 더 올릴 수 없습니다 (하루 스무 개)';
  end if;

  insert into wanted (by_user, cat, sub, region, title, body, budget,
                      when_txt, contact, agree_at)
  values (v_uid, v_cat, v_sub, v_region, v_title, v_body, v_budget,
          v_when, v_contact, (p->>'agree_at')::timestamptz)
  returning id into v_id;
  return v_id;
end $$;
revoke all on function open_wanted(jsonb) from public;
grant execute on function open_wanted(jsonb) to authenticated;

-- ════════════════════════════════════════════════════════════════════
-- ⑥ 문 — 글을 고칩니다
--   ⚠️⚠️ **보낸 칸만 고칩니다.** `save_provider_self` 처럼 통째로
--   덮으면 화면이 칸 하나를 빠뜨리는 날 그 칸이 **지워집니다**
--   (`js/deskme.js` 가 `industries` 를 지우고 있던 그 자리).
--   ⚠️⚠️ **분류 · 하위 · 지역은 못 고칩니다** — 바꾸면 답하신 분이
--   다른 것에 묶입니다 (조인에서 날짜 · 지역을 막은 그 까닭).
-- ════════════════════════════════════════════════════════════════════
create or replace function edit_wanted(p jsonb)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_uid   uuid := auth.uid();
  v_id    uuid := nullif(btrim(coalesce(p->>'id','')), '')::uuid;
  v_owner uuid;
  v_state text;
  v_budget int;
begin
  if v_uid is null then
    raise exception '로그인이 필요합니다';
  end if;
  if v_id is null then
    raise exception '어느 글인지 알 수 없습니다';
  end if;
  select by_user, state into v_owner, v_state from wanted where id = v_id;
  if v_owner is null then
    raise exception '그 글을 찾을 수 없습니다';
  end if;
  if v_owner <> v_uid then
    raise exception '올리신 분만 고칠 수 있습니다';
  end if;
  if v_state <> 'open' then
    raise exception '찾는 중인 글만 고칠 수 있습니다';
  end if;

  if p ? 'title' then
    if char_length(btrim(coalesce(p->>'title',''))) < 2 then
      raise exception '제목을 두 글자 이상 적어 주세요';
    end if;
    if char_length(btrim(p->>'title')) > 60 then
      raise exception '제목이 너무 깁니다 (60자)';
    end if;
    update wanted set title = btrim(p->>'title'), updated_at = now()
     where id = v_id;
  end if;

  if p ? 'body' then
    if char_length(btrim(coalesce(p->>'body',''))) < 5 then
      raise exception '내용을 다섯 글자 이상 적어 주세요';
    end if;
    if char_length(btrim(p->>'body')) > 2000 then
      raise exception '내용이 너무 깁니다 (2000자)';
    end if;
    update wanted set body = btrim(p->>'body'), updated_at = now()
     where id = v_id;
  end if;

  -- ⚠️ 예산을 **지우실 수도** 있어야 합니다 — 빈 글자를 보내면 null 로
  if p ? 'budget' then
    if btrim(coalesce(p->>'budget','')) = '' then
      update wanted set budget = null, updated_at = now() where id = v_id;
    else
      begin
        v_budget := btrim(p->>'budget')::int;
      exception when others then
        raise exception '예산은 숫자로 적어 주세요';
      end;
      if v_budget < 0 or v_budget > 100000000 then
        raise exception '예산이 올바르지 않습니다';
      end if;
      update wanted set budget = v_budget, updated_at = now() where id = v_id;
    end if;
  end if;

  if p ? 'when_txt' then
    if char_length(btrim(coalesce(p->>'when_txt',''))) > 60 then
      raise exception '언제 필요하신지가 너무 깁니다 (60자)';
    end if;
    update wanted set when_txt = nullif(btrim(p->>'when_txt'), ''),
                      updated_at = now()
     where id = v_id;
  end if;
end $$;
revoke all on function edit_wanted(jsonb) from public;
grant execute on function edit_wanted(jsonb) to authenticated;

-- ════════════════════════════════════════════════════════════════════
-- ⑦ 문 — 답합니다 ("제가 해 드릴 수 있습니다")
-- ════════════════════════════════════════════════════════════════════
create or replace function reply_wanted(p jsonb)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_uid     uuid := auth.uid();
  v_w       uuid := nullif(btrim(coalesce(p->>'w_id','')), '')::uuid;
  v_body    text := nullif(btrim(coalesce(p->>'body','')), '');
  v_contact text := nullif(btrim(coalesce(p->>'contact','')), '');
  v_as_pro  text := nullif(btrim(coalesce(p->>'as_pro','')), '');
  v_owner   uuid;
  v_state   text;
  v_id      uuid;
begin
  if v_uid is null then
    raise exception '로그인이 필요합니다';
  end if;
  if v_w is null then
    raise exception '어느 글인지 알 수 없습니다';
  end if;
  select by_user, state into v_owner, v_state from wanted where id = v_w;
  if v_owner is null then
    raise exception '그 글을 찾을 수 없습니다';
  end if;
  if v_state <> 'open' then
    raise exception '이미 끝난 글입니다';
  end if;
  -- ⚠️ 제 글에는 답할 수 없습니다 (답 수를 제가 올리는 꼴입니다)
  if v_owner = v_uid then
    raise exception '올리신 글에는 답하실 수 없습니다';
  end if;
  if v_body is null or char_length(v_body) < 5 then
    raise exception '답을 다섯 글자 이상 적어 주세요';
  end if;
  if char_length(v_body) > 500 then
    raise exception '답이 너무 깁니다 (500자)';
  end if;
  if v_contact is null then
    raise exception '연락처를 적어 주세요';
  end if;
  if length(v_contact) > 100 then
    raise exception '연락처가 너무 깁니다';
  end if;

  -- ⚠️⚠️ **업체 이름으로 답하는 것은 고르는 것입니다** (0048 의 as_pro).
  --   ⚠️ 승인된 · 검사용이 아닌 업체여야 하고, **그 업체에 이어진
  --   분**이어야 합니다 — 남의 상호를 빌려 쓰지 못합니다.
  if v_as_pro is not null then
    if coalesce(my_provider(), '') <> v_as_pro then
      raise exception '그 업체의 담당자만 업체 이름으로 답할 수 있습니다';
    end if;
    if not exists (select 1 from provider
                    where id = v_as_pro and listed = true
                      and is_test = false and state = 'approved') then
      raise exception '지금은 업체 이름으로 답할 수 없습니다';
    end if;
  end if;

  if p->>'agree_at' is null then
    raise exception '개인정보 수집 · 이용 동의가 필요합니다';
  end if;
  if (p->>'agree_at')::timestamptz > now() + interval '5 minutes'
     or (p->>'agree_at')::timestamptz < now() - interval '1 day' then
    raise exception '동의 시각이 올바르지 않습니다';
  end if;

  -- ⚠️ 한 글에 한 번만 — 표의 unique 가 막지만 **다른 말로** 거절합니다
  if exists (select 1 from wantedreply where w_id = v_w and by_user = v_uid) then
    raise exception '이미 답하셨습니다';
  end if;
  -- ⚠️ 쏟아붓기 — 하루에 서른 건까지
  if (select count(*) from wantedreply
       where by_user = v_uid and created_at > now() - interval '1 day') >= 30 then
    raise exception '오늘은 더 답하실 수 없습니다 (하루 서른 건)';
  end if;

  insert into wantedreply (w_id, by_user, as_pro, body, contact, agree_at)
  values (v_w, v_uid, v_as_pro, v_body, v_contact,
          (p->>'agree_at')::timestamptz)
  returning id into v_id;
  return v_id;
end $$;
revoke all on function reply_wanted(jsonb) from public;
grant execute on function reply_wanted(jsonb) to authenticated;

-- ════════════════════════════════════════════════════════════════════
-- ⑧ 문 — 답을 받아들이거나 거절합니다 (올린 분) · 거둡니다 (답한 분)
--   ⚠️⚠️⚠️ **받아들여도 연락처는 안 열립니다** (제17조 제2항).
--   여는 것은 ⑩ `share_wantedcontact` 이고 **각자 제 것만** 엽니다.
-- ════════════════════════════════════════════════════════════════════
create or replace function move_wantedreply(p jsonb)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_uid   uuid := auth.uid();
  v_id    uuid := nullif(btrim(coalesce(p->>'id','')), '')::uuid;
  v_to    text := nullif(btrim(coalesce(p->>'to','')), '');
  v_owner uuid;
  v_by    uuid;
  v_cur   text;
begin
  if v_uid is null then
    raise exception '로그인이 필요합니다';
  end if;
  if v_id is null then
    raise exception '어느 답인지 알 수 없습니다';
  end if;
  if v_to is null or v_to not in ('accepted','rejected','canceled') then
    raise exception '옮길 자리가 올바르지 않습니다';
  end if;
  select w.by_user, r.by_user, r.state into v_owner, v_by, v_cur
    from wantedreply r join wanted w on w.id = r.w_id
   where r.id = v_id;
  if v_by is null then
    raise exception '그 답을 찾을 수 없습니다';
  end if;
  if v_cur <> 'replied' then
    raise exception '이미 처리된 답입니다';
  end if;

  -- ⚠️⚠️ **받아들이기 · 거절은 올린 분만, 거두기는 답한 분만**입니다.
  --   ⚠️ `coalesce(…, false)` 로 땅에 내려놓습니다 — SQL 에는 참 · 거짓
  --   말고 NULL 이 있고, `not (NULL or false)` 는 NULL 이라 `if` 에
  --   안 걸립니다 (0034 에서 남의 일정을 누구나 취소할 수 있던 자리).
  if v_to in ('accepted','rejected') then
    if not coalesce(v_owner = v_uid, false) then
      raise exception '글을 올리신 분만 하실 수 있습니다';
    end if;
  else
    if not coalesce(v_by = v_uid, false) then
      raise exception '답하신 분만 거두실 수 있습니다';
    end if;
  end if;

  update wantedreply set state = v_to where id = v_id;
end $$;
revoke all on function move_wantedreply(jsonb) from public;
grant execute on function move_wantedreply(jsonb) to authenticated;

-- ════════════════════════════════════════════════════════════════════
-- ⑨ 문 — 글을 내리거나 "구했습니다" 로 옮깁니다 (올린 분만)
-- ════════════════════════════════════════════════════════════════════
create or replace function close_wanted(p jsonb)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_uid   uuid := auth.uid();
  v_id    uuid := nullif(btrim(coalesce(p->>'id','')), '')::uuid;
  v_to    text := coalesce(nullif(btrim(coalesce(p->>'to','')), ''), 'closed');
  v_owner uuid;
  v_state text;
begin
  if v_uid is null then
    raise exception '로그인이 필요합니다';
  end if;
  if v_id is null then
    raise exception '어느 글인지 알 수 없습니다';
  end if;
  if v_to not in ('done','closed') then
    raise exception '옮길 자리가 올바르지 않습니다';
  end if;
  select by_user, state into v_owner, v_state from wanted where id = v_id;
  if v_owner is null then
    raise exception '그 글을 찾을 수 없습니다';
  end if;
  -- ⚠️ 내리는 문은 **올린 사람만** 씁니다 — 운영자가 가리는 길은 ⑪ 입니다
  if v_owner <> v_uid then
    raise exception '올리신 분만 하실 수 있습니다';
  end if;
  if v_state <> 'open' then
    raise exception '이미 끝난 글입니다';
  end if;
  update wanted set state = v_to, updated_at = now() where id = v_id;
end $$;
revoke all on function close_wanted(jsonb) from public;
grant execute on function close_wanted(jsonb) to authenticated;

-- ════════════════════════════════════════════════════════════════════
-- ⑩ 문 — 연락처를 **각자 제 것만** 엽니다 · 언제든 닫습니다
--   ⚠️⚠️⚠️ **받아들이기만으로는 안 열립니다** (제17조 제2항). 받아들이는
--   것은 "얘기해 봅시다" 이지 "내 번호를 줘도 좋다" 가 아닙니다.
--   ⚠️ **맞바꾸기를 강요하지 않습니다** — 한쪽만 열어도 그쪽 것만 갑니다
--   (강요하면 "줘야 받는" 구조가 되어 사실상 강제 동의입니다).
-- ════════════════════════════════════════════════════════════════════
create or replace function share_wantedcontact(p jsonb)
returns text
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_id  uuid := nullif(btrim(coalesce(p->>'id','')), '')::uuid;
  v_on  boolean := coalesce((p->>'on')::boolean, true);
  v_own uuid;
  v_by  uuid;
  v_st  text;
begin
  if v_uid is null then raise exception '로그인이 필요합니다'; end if;
  if v_id is null then raise exception '어느 답인지 알 수 없습니다'; end if;
  -- ⚠️ **여는 쪽만** 동의 시각을 받습니다 (닫는 것은 철회라 동의가
  --   필요 없습니다 — 닫을 때도 요구하면 철회를 막는 꼴입니다)
  if v_on then
    if p->>'agree_at' is null then
      raise exception '연락처 제공 동의가 필요합니다';
    end if;
    if (p->>'agree_at')::timestamptz > now() + interval '5 minutes'
       or (p->>'agree_at')::timestamptz < now() - interval '1 day' then
      raise exception '동의 시각이 올바르지 않습니다';
    end if;
  end if;

  select r.by_user, r.state, w.by_user into v_by, v_st, v_own
    from wantedreply r join wanted w on w.id = r.w_id
   where r.id = v_id;
  if v_st is null then raise exception '그런 답이 없습니다'; end if;
  if v_st <> 'accepted' then
    raise exception '받아들인 뒤에 고르실 수 있습니다';
  end if;

  if coalesce(v_own = v_uid, false) then
    update wantedreply
       set owner_share_at = case when v_on then now() else null end
     where id = v_id;
    return case when v_on then 'owner_shared' else 'owner_hidden' end;
  elsif coalesce(v_by = v_uid, false) then
    update wantedreply
       set helper_share_at = case when v_on then now() else null end
     where id = v_id;
    return case when v_on then 'helper_shared' else 'helper_hidden' end;
  end if;
  raise exception '이 답과 관계가 없습니다';
end $$;
revoke all on function share_wantedcontact(jsonb) from public;
grant execute on function share_wantedcontact(jsonb) to authenticated;

-- ════════════════════════════════════════════════════════════════════
-- ⑪ 문 — 운영자가 가립니다 (0049 · 0056 과 같은 꼴)
--   ⚠️ 글쓴이가 내리는 길(`close_wanted`)과 **다른 일**이라 문을
--   갈라 둡니다 (내린 것은 글쓴이의 뜻, 가린 것은 운영자의 판단).
--   ⚠️⚠️ **까닭이 반드시** 있습니다 — 까닭 없이 가릴 수 있으면
--   불평이 들어올 때마다 지워 주는 자리가 됩니다.
-- ════════════════════════════════════════════════════════════════════
create or replace function move_wanted(p jsonb)
returns text
language plpgsql security definer set search_path = public as $$
declare
  v_uid  uuid := auth.uid();
  v_id   uuid := nullif(btrim(coalesce(p->>'id','')), '')::uuid;
  v_why  text := nullif(btrim(coalesce(p->>'why','')), '');
  v_st   text;
begin
  if v_uid is null then raise exception '로그인이 필요합니다'; end if;
  if coalesce(my_role(), '') not in ('staff','admin') then
    raise exception '가리는 것은 운영자만 할 수 있습니다';
  end if;
  if v_id is null then raise exception '어느 글인지 알 수 없습니다'; end if;
  -- ⚠️⚠️ 까닭을 **반드시** 받습니다 — 까닭 없이 가릴 수 있으면 불평이
  --   올 때마다 지워 주는 자리가 됩니다
  if v_why is null or char_length(v_why) < 5 then
    raise exception '가리는 까닭을 다섯 글자 이상 적어 주세요';
  end if;
  if char_length(v_why) > 300 then
    raise exception '까닭이 너무 깁니다 (300자)';
  end if;

  select state into v_st from wanted where id = v_id for update;
  if v_st is null then raise exception '그런 글이 없습니다'; end if;
  if v_st = 'hidden' then raise exception '이미 가려진 글입니다'; end if;

  update wanted set state = 'hidden', hidden_why = v_why,
                    hidden_by = v_uid, hidden_at = now(), updated_at = now()
   where id = v_id;

  -- ⚠️ 감사 기록에 **본문을 넣지 않습니다** (오래 남고 보는 사람도 넓습니다)
  insert into audit_log (by_user, by_role, obj, obj_id, from_state, to_state, data)
  values (v_uid, my_role(), 'wanted', v_id::text, v_st, 'hidden',
          jsonb_build_object('why_len', char_length(v_why)));
  return 'hidden';
end $$;
revoke all on function move_wanted(jsonb) from public;
grant execute on function move_wanted(jsonb) to authenticated;

-- ════════════════════════════════════════════════════════════════════
-- ⑫ 신고 — **새 표를 안 만들고** `report` 에 칸을 하나 더합니다
--   ⚠️⚠️ **칸만 더하면 아무도 그 칸을 못 씁니다.** `open_report` 가 그
--   열쇠를 모르면 그 칸은 **영원히 null** 이고, 운영자 화면의 "이 글
--   가리기" 가지는 죽은 코드가 됩니다 (이 저장소가 "만들어 놓고 안 쓰는
--   칸" 을 다섯 번 겪은 자리). 그래서 문을 **같이** 고칩니다.
--   체인: open_report (0040 → 0046 → 0047 → 0048 → 0056 → 0060 → **0061**)
--   ⚠️ 내려갔는지 보는 법:
--       select pg_get_functiondef('open_report(jsonb)'::regprocedure)
--         like '%wanted_id%';
-- ════════════════════════════════════════════════════════════════════
alter table report add column if not exists wanted_id uuid
  references wanted(id) on delete cascade;
create index if not exists report_wanted_idx on report (wanted_id)
  where wanted_id is not null;

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
  -- ⚠️ 0056 — 중고 직거래 매물도 신고할 수 있습니다
  v_ls   uuid := nullif(btrim(coalesce(p->>'listing', '')), '')::uuid;
  -- ⚠️ 0060 — 업체가 올린 티타임 자리도 신고할 수 있습니다
  v_tt   uuid := nullif(btrim(coalesce(p->>'teetime', '')), '')::uuid;
  -- ⚠️ 0061 — 회원이 올린 구합니다 글도 신고할 수 있습니다
  v_wt   uuid := nullif(btrim(coalesce(p->>'wanted', '')), '')::uuid;
  v_body text := btrim(coalesce(p->>'body', ''));
  v_id   uuid;
  v_dup  int;
begin
  if v_me is null then raise exception '신고는 로그인한 뒤에 하실 수 있습니다'; end if;
  if v_kind not in ('abuse','dispute') then
    raise exception '신고 · 분쟁 중 하나로 적어 주세요';
  end if;
  if v_req is null and v_pv is null and v_rv is null and v_jr is null
     and v_cq is null and v_ca is null and v_jp is null and v_ls is null
     and v_tt is null and v_wt is null then
    raise exception '무엇에 대한 것인지 적어 주세요 (요청 · 업체 · 후기 · 조인 · 글 · 매물 · 티타임 · 구합니다 가운데 하나)';
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
     and jobpost_id is not distinct from v_jp
     and listing_id is not distinct from v_ls
     and teetime_id is not distinct from v_tt
     and wanted_id is not distinct from v_wt;
  if v_dup > 0 then
    raise exception '같은 건으로 이미 접수된 것이 있습니다 — 운영자가 보고 있습니다';
  end if;

  insert into report (kind, request_id, provider_id, review_id, joinroom_id,
                      cq_id, ca_id, jobpost_id, listing_id, teetime_id,
                      wanted_id, by_user, body)
  values (v_kind, v_req, v_pv, v_rv, v_jr, v_cq, v_ca, v_jp, v_ls, v_tt,
          v_wt, v_me, v_body)
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

-- ════════════════════════════════════════════════════════════════════
-- ⑬ 알림 (0050) — **밖으로 안 보냅니다.** 화면 안에서만 알립니다.
--   ⚠️⚠️ **제약 이름을 글자로 박지 않습니다** — 0050 은 칸 안에 그냥
--   `check (kind in (...))` 로 적어 이름을 Postgres 가 지어 줍니다.
--   이름이 다른 날 옛 제약이 **그대로 남고** 새 갈래를 거절하면서
--   에러는 트리거 안에서 조용히 나고 **알림만 안 붙습니다** (0053 의
--   그 자리). 그래서 그 칸을 지키는 check 를 **찾아서** 떼어 냅니다.
-- ════════════════════════════════════════════════════════════════════
do $$
declare c record;
begin
  for c in
    select conname from pg_constraint
     where conrelid = 'notice'::regclass and contype = 'c'
       and pg_get_constraintdef(oid) like '%kind%'
  loop
    execute format('alter table notice drop constraint %I', c.conname);
  end loop;
end $$;
alter table notice add constraint notice_kind_check check (kind in
  ('quote','jobapply','jobmoved','joinapply','joinmoved',
   'answer','hidden','inquiry','listingask','listingmoved','watch',
   'teebook','teemoved','wantedreply','wantedmoved'));

-- 내 구합니다 글에 답이 들어왔습니다 → 올리신 분에게
create or replace function notice_wantedreply() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_to uuid;
begin
  select w.by_user into v_to from wanted w where w.id = new.w_id;
  perform notify_one(v_to, 'wantedreply', '올리신 글에 답이 들어왔습니다',
                     '/my', 'wanted', new.w_id::text);
  return null;
end $$;
revoke all on function notice_wantedreply() from public;
drop trigger if exists notice_wantedreply_t on wantedreply;
create trigger notice_wantedreply_t after insert on wantedreply
  for each row execute function notice_wantedreply();

-- 답이 처리되었습니다 → 답하신 분에게
create or replace function notice_wantedmoved() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.state = old.state or new.state not in ('accepted','rejected') then
    return null;
  end if;
  perform notify_one(new.by_user, 'wantedmoved',
    case when new.state = 'accepted' then '보내신 답이 받아들여졌습니다'
         else '보내신 답이 거절되었습니다' end,
    '/my', 'wantedreply', new.id::text);
  return null;
end $$;
revoke all on function notice_wantedmoved() from public;
drop trigger if exists notice_wantedmoved_t on wantedreply;
create trigger notice_wantedmoved_t after update of state on wantedreply
  for each row execute function notice_wantedmoved();

-- 글이 가려졌습니다 → 올리신 분에게
--   ⚠️ 갈래는 0050 의 `hidden` 을 그대로 씁니다 (가리는 것은 무엇이든
--   같은 말이라, 갈래를 늘리면 화면이 아이콘을 또 골라야 합니다)
create or replace function notice_hidden_wanted() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.state = old.state or new.state <> 'hidden' then return null; end if;
  perform notify_one(new.by_user, 'hidden', '올리신 구합니다 글이 가려졌습니다',
                     '/my', 'wanted', new.id::text);
  return null;
end $$;
revoke all on function notice_hidden_wanted() from public;
drop trigger if exists notice_hidden_wanted_t on wanted;
create trigger notice_hidden_wanted_t after update of state on wanted
  for each row execute function notice_hidden_wanted();

insert into schema_version (n, name) values (61, '0061_wanted')
  on conflict (n) do nothing;

commit;
