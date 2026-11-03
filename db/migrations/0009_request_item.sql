-- ════════════════════════════════════════════════════════════════════
-- 0009 — 신청 하나에 서비스 여러 개 (QuoteRequest ↔ QuoteRequestItem)
--        2026-10-17 "창업 준비 전문관" 지시서 §6 · §7
--
-- ⚠️⚠️ **왜 이 파일이 생겼나 — 서비스별 배정이 불가능했습니다.**
--   `request` 는 `cat` 한 칸 · `offer_id` 한 칸이고 `assignment` 는
--   **신청 단위**입니다. 그래서 "인테리어 → A업체 · 주방설비 → B업체"
--   를 적을 자리가 아예 없었습니다. 화면에서는 2026-10-09 부터 상품을
--   여러 개 고를 수 있었는데, 접수에는 **이름이 이어 붙은 한 줄**로만
--   들어와서 기계가 항목으로 다루지 못했습니다.
--
-- ⚠️⚠️ **기존 칸을 지우지 않았습니다** (지시서 §1 "기존 회원정보,
--   서비스, 신청 내역, 업체 데이터, 관리자 기능은 보존한다").
--   `request.cat` · `request.offer_id` 는 그대로 있고, 항목이 있는
--   신청에서는 `cat` 이 **첫 항목**을 가리킵니다 — 옛 화면 · 옛 질의가
--   그대로 돕니다.
--
-- ⚠️⚠️ **백필이 없습니다.** 손님 데이터가 아직 0건입니다 (DB 는 섰고
--   Vercel 환경변수 대기). 그래서 표를 더하는 것이 안전합니다 —
--   쌓인 뒤였다면 `cat` 하나를 항목 한 줄로 옮기는 백필이 먼저입니다.
--
--     ① request_item      신청의 서비스 항목 (항목마다 제 상태)
--     ② assignment.item_id 배정이 **항목 하나**를 가리킵니다 (null 허용)
--     ③ save_request_items 접수가 항목을 통째로 적습니다 (트랜잭션)
--     ④ assign_item       항목 하나를 업체에 배정 (제17조 재동의 필수)
--     ⑤ move_item_state   항목 하나의 상태 (길 표를 그대로 봅니다)
--
-- ⚠️ 두 번 돌려도 안전합니다 (if not exists · create or replace).
-- ⚠️⚠️ 돌린 파일(0001 · 0004 · 0007 · 0008)을 **고치지 않았습니다** —
--   db/README.md 의 규칙대로 다음 번호로 새로 만듭니다.
-- ════════════════════════════════════════════════════════════════════

begin;

-- ════════════════════════════════════════════════════════════════════
-- ⓪ 멱등 열쇠 (§8 "재시도 요청의 중복 접수를 방지")
--
-- ⚠️⚠️ **화면이 신청서 하나에 열쇠 하나**를 만들어 보냅니다. 끊겨서
--   다시 누르시면 같은 열쇠가 오고, 서버가 그걸 보고 "새 신청이
--   아니라 재시도" 로 알아봅니다 — 전에는 **같은 분류 · 10분 안**으로만
--   봐서, 서비스를 여러 개 고르셨거나 10분이 지난 재시도는 **두 번
--   접수**됐습니다.
-- ⚠️ `null` 을 허용합니다 — 옛 화면과 `/sell` · `/closure` 는 아직
--   열쇠를 안 보냅니다. 그쪽은 전과 똑같이 분류 · 시각으로 봅니다.
-- ⚠️⚠️ **부분 unique 입니다** (null 은 안 걸립니다). 두 번째 요청이
--   틈새로 지나가도 여기서 멈춥니다 — 조회로 거르는 것이 첫째이고
--   이것이 **둘째 자물쇠**입니다.
alter table request add column if not exists idem text;
create unique index if not exists request_idem_once
  on request (idem) where idem is not null;


-- ════════════════════════════════════════════════════════════════════
-- ① 신청 서비스 항목
--
-- ⚠️⚠️ **`service_id` 는 `js/data/catalog.js` 의 분류 key 입니다**
--   (`interior` · `equip` · `admin` …). 지시서 §6 이 "서비스 ID는 기존
--   서비스 데이터의 고유 ID를 사용한다 · 서비스명을 문자열로만 저장하여
--   이름 변경 시 데이터 관계가 깨지는 설계는 피한다" 고 직접 적은
--   자리입니다 — 이름은 화면이 그때그때 읽습니다.
-- ⚠️ `text` 인 까닭은 업체 id · 상품 id 와 같습니다 — 그 key 들이
--   이미 주소(`/providers/interior`)로 색인되어 있어 uuid 로 바꿀 수가
--   없습니다.
-- ⚠️⚠️ **분류가 내려가도 지난 항목은 남습니다** (§12 "서비스가
--   비활성화되어도 과거 신청 기록은 보존한다"). 그래서 외래키를 걸지
--   않습니다 — 분류는 DB 가 아니라 코드에 있는 목록입니다.
-- ⚠️ `state` 가 항목마다 따로입니다 (§7 "상태를 하나의 신청서 전체에만
--   적용하지 말고 필요한 경우 서비스 항목별 상태를 관리한다").
create table if not exists request_item (
  id          uuid primary key default gen_random_uuid(),
  request_id  uuid not null references request(id) on delete cascade,
  service_id  text not null,
  -- §5-3 그 서비스에서만 묻는 답 (공통 칸은 request.detail 입니다)
  detail      jsonb not null default '{}',
  state       deal_state not null default 'new',
  created_at  timestamptz not null default now(),
  -- ⚠️⚠️ **같은 서비스를 두 번 담지 않습니다** (§3-2 중복 선택 방지).
  --   화면에서도 막지만, 두 번 눌린 요청이 들어오면 여기서 멈춥니다.
  constraint request_item_once unique (request_id, service_id),
  constraint request_item_svc check (service_id <> '' and length(service_id) <= 60)
);
create index if not exists request_item_req_idx on request_item (request_id);
create index if not exists request_item_state_idx on request_item (state, created_at desc);

alter table request_item enable row level security;

-- ⚠️⚠️ **이 블록이 정책보다 먼저여야 합니다.** 아래 `is_my_item()` 이
--   `assignment.item_id` 를 읽는데, 칸을 나중에 더하면
--   *"column a.item_id does not exist"* 로 **파일이 통째로 멈춥니다** —
--   실제 Postgres 에서 돌려 보고 알았습니다 (SQL 만 읽어서는 멀쩡해
--   보입니다). 이 저장소가 0001 을 414줄 써 놓고 한 번도 안 돌려 봤다가
--   둘이 깨져 있던 그 자리입니다.

-- ════════════════════════════════════════════════════════════════════
-- ② 배정이 **항목 하나**를 가리킵니다 (§7)
--
-- ⚠️⚠️ **null 을 허용합니다.** 지금까지의 배정은 신청 전체를 가리키고
--   있고, not null 로 두면 그 줄들이 전부 깨집니다 (지금은 0건이지만
--   규칙이 그렇습니다). 항목이 있는 신청은 항목을 가리키고, 없는
--   신청은 전과 똑같이 신청 전체를 가리킵니다.
alter table assignment add column if not exists item_id uuid
  references request_item(id) on delete cascade;
create index if not exists assign_item_idx on assignment (item_id);

-- ⚠️⚠️ **한 항목 × 한 업체 = 한 줄입니다.** 같은 업체를 같은 항목에
--   두 번 배정하면 안내가 두 번 가고 수수료가 두 번 잡힙니다.
--   ⚠️ 부분 인덱스입니다 — `item_id` 가 null 인 옛 줄은 안 걸립니다
--   (0001 의 `unique (request_id, provider_id)` 가 그쪽을 지킵니다).
create unique index if not exists assign_item_once
  on assignment (item_id, provider_id) where item_id is not null;


-- 볼 수 있는 사람은 **그 신청을 볼 수 있는 사람**과 같습니다.
-- ⚠️⚠️ 정책 안에서 `request` 를 바로 읽으면 **무한 재귀**입니다
--   (`request_assigned` 가 `assignment` 를 읽고 그쪽이 다시 request 를
--   읽습니다 — 0005 에서 실제로 겪었습니다). security definer 함수로
--   끊습니다.
drop policy if exists item_mine on request_item;
create policy item_mine on request_item for select
  using (is_my_request(request_id));

drop policy if exists item_staff on request_item;
create policy item_staff on request_item for select
  using (my_role() in ('staff','admin'));

-- 업체는 **자기에게 배정된 항목만** 봅니다.
-- ⚠️⚠️ 배정되지 않은 항목까지 보이면, 한 신청서에 같이 담긴 다른
--   서비스의 내용을 그 업체가 읽습니다 — 배정이 곧 제3자 제공이라
--   배정된 것만입니다 (제17조).
create or replace function is_my_item(iid uuid) returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (select 1 from assignment a
                  where a.item_id = iid and a.provider_id = my_provider())
$$;
revoke all on function is_my_item(uuid) from public;
grant execute on function is_my_item(uuid) to authenticated;

drop policy if exists item_provider on request_item;
create policy item_provider on request_item for select
  using (my_provider() is not null and is_my_item(id));

-- ⚠️⚠️ **읽기만 줍니다.** 쓰기를 주면 기록 없이 지나가는 길이 하나
--   생깁니다 (§8) — 아래 문 셋으로만 바뀝니다.
-- ⚠️ `anon`(로그인 안 한 사람)에게는 아무 권한도 주지 않습니다.
grant select on request_item to authenticated;


-- ════════════════════════════════════════════════════════════════════
-- ③ 접수가 항목을 적습니다 — 한 트랜잭션 (§8)
--
-- ⚠️⚠️ **신청서와 항목이 같이 적히거나 같이 안 적힙니다.** §8 이
--   "신청서 저장과 서비스 항목 저장이 중간에 실패하여 불완전한 신청이
--   생성되지 않도록 트랜잭션을 적용한다" 고 적은 자리입니다 — 함수
--   하나가 둘을 다 적으면 plpgsql 이 알아서 한 트랜잭션입니다.
-- ⚠️ 서버(service key)가 부릅니다. 로그인 없이 들어오는 접수라
--   `auth.uid()` 가 비어 있고, 그래서 **상태를 바꾸지 않습니다** —
--   새로 만들기만 합니다 (기록이 필요한 변경이 아닙니다).
-- ⚠️⚠️ 같은 신청에 두 번 불려도 **줄이 안 늘어납니다**
--   (`on conflict do nothing`) — 멱등입니다 (§8).
create or replace function save_request_items(p_request uuid, p_items jsonb)
  returns int
  language plpgsql security definer set search_path = public as $$
declare
  n int := 0;
  it jsonb;
  sid text;
begin
  if p_request is null then
    raise exception '신청을 찾을 수 없습니다';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    return 0;
  end if;

  for it in select * from jsonb_array_elements(p_items) loop
    sid := nullif(btrim(coalesce(it->>'id', '')), '');
    -- ⚠️ 빈 id 는 **조용히 건너뜁니다**. 여기서 터뜨리면 멀쩡한 나머지
    --    항목까지 같이 잃습니다 — 접수를 잃는 쪽이 더 나쁩니다.
    continue when sid is null;
    insert into request_item (request_id, service_id, detail)
    values (p_request, sid,
            coalesce(case when jsonb_typeof(it->'detail') = 'object'
                          then it->'detail' else null end, '{}'::jsonb))
    on conflict (request_id, service_id) do nothing;
    if found then n := n + 1; end if;
  end loop;
  return n;
end $$;
revoke all on function save_request_items(uuid, jsonb) from public;


-- ════════════════════════════════════════════════════════════════════
-- ④ 항목 하나를 업체에 배정 (§7)
--
-- ⚠️⚠️ **배정이 곧 제3자 제공입니다** (개인정보보호법 제17조 제2항).
--   `p_agree3rd` 가 true 가 아니면 거절합니다 — 0004 의 `move_state()`
--   와 **같은 규칙**이고, 방침 제4조 제3항이 "접수 단계의 동의에는
--   제3자 제공이 포함되지 않습니다" 라고 적고 있습니다.
-- ⚠️ 동의를 **시각으로** 남깁니다. boolean 으로 두면 "언제 받았나" 를
--   못 대고, 그게 분쟁에서 받지 않은 것과 같아집니다.
create or replace function assign_item(
  p_item uuid, p_provider text, p_agree3rd boolean, p_why text default null)
  returns void
  language plpgsql security definer set search_path = public as $$
declare
  r   request_item%rowtype;
  rol app_role := my_role();
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception '변경자를 알 수 없습니다 — 로그인 후 다시 시도해 주세요';
  end if;
  if rol not in ('staff','admin') then
    raise exception '배정은 직원 · 관리자만 할 수 있습니다';
  end if;

  select * into r from request_item where id = p_item;
  if not found then raise exception '항목을 찾을 수 없습니다'; end if;

  if p_agree3rd is not true then
    raise exception '제3자 제공 동의를 먼저 받아야 합니다 (개인정보보호법 제17조 제2항)';
  end if;
  if not exists (select 1 from provider where id = p_provider) then
    raise exception '등록된 업체가 아닙니다 — %', p_provider;
  end if;

  insert into assignment (request_id, provider_id, item_id, state,
                          agree3rd_at, by_user, why)
  values (r.request_id, p_provider, p_item, 'sent', now(), uid, p_why)
  -- ⚠️⚠️ **부분 인덱스라 `where` 를 같이 적어야 합니다.** 안 적으면
  --   Postgres 가 *"there is no unique or exclusion constraint matching
  --   the ON CONFLICT specification"* 로 거절합니다 — 실제로 돌려 보고
  --   알았습니다 (SQL 만 읽어서는 멀쩡해 보입니다).
  on conflict (item_id, provider_id) where item_id is not null do nothing;

  -- ⚠️ 신청 쪽 동의 시각도 같이 남깁니다 — 둘 중 하나만 있으면
  --    "언제 받았나" 를 한쪽에서만 댈 수 있습니다.
  update request set agree3rd_at = coalesce(agree3rd_at, now())
   where id = r.request_id;

  update request_item set state = 'assigned' where id = p_item;

  -- ⚠️⚠️ 기록과 변경이 **한 트랜잭션**입니다 — 기록이 실패하면
  --    배정도 안 됩니다. 기록 없이 지나갈 길이 없습니다 (§8).
  insert into audit_log (by_user, by_role, obj, obj_id,
                         from_state, to_state, why, data)
  values (uid, rol, 'request_item', p_item::text,
          r.state::text, 'assigned', p_why,
          jsonb_build_object('provider_id', p_provider,
                             'service_id',  r.service_id,
                             'request_id',  r.request_id));
end $$;
revoke all on function assign_item(uuid, text, boolean, text) from public;
grant execute on function assign_item(uuid, text, boolean, text) to authenticated;


-- ════════════════════════════════════════════════════════════════════
-- ⑤ 항목 하나의 상태 (§7)
--
-- ⚠️⚠️ **길 표(`deal_move`)를 그대로 봅니다.** 0004 가 만든 그 표이고,
--   `js/data/deal.js` 의 `AM_DEAL_MOVE` 에서 나온 것입니다 — 항목용
--   길을 따로 적으면 두 곳이 어긋나고, 화면이 안 내는 길로 DB 가
--   통과시키는 날이 옵니다.
-- ⚠️⚠️ **돈이 걸린 상태로는 여기서 못 갑니다.** 수수료는 계약(`deal`)
--   단위이고 `confirm_fee()` · `mark_paid()` 로만 갑니다 (§13 가짜
--   정산 금지) — 0004 와 같은 규칙입니다.
-- ⚠️ 배정은 ④ 로 갑니다 — 제17조 동의를 받는 자리가 거기 하나라야
--   합니다.
create or replace function move_item_state(
  p_item uuid, p_to deal_state, p_why text default null)
  returns void
  language plpgsql security definer set search_path = public as $$
declare
  r   request_item%rowtype;
  rol app_role := my_role();
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception '변경자를 알 수 없습니다 — 로그인 후 다시 시도해 주세요';
  end if;

  select * into r from request_item where id = p_item;
  if not found then raise exception '항목을 찾을 수 없습니다'; end if;

  if p_to in ('fee_wait','fee_done') then
    raise exception '수수료는 계약에서 확정합니다 — confirm_fee() · mark_paid() 로 가세요';
  end if;
  if p_to = 'assigned' then
    raise exception '배정은 assign_item() 으로 하세요 (제3자 제공 동의가 필요합니다)';
  end if;

  -- ⚠️ 갈 수 없는 길인지와 역할이 모자란지를 **갈라서** 말해 줍니다 —
  --    화면이 다른 안내를 해야 합니다 (0004 와 같은 규칙).
  if not exists (select 1 from deal_move m
                  where m.from_state = r.state and m.to_state = p_to) then
    raise exception '갈 수 없는 길입니다 — % → %', r.state, p_to;
  end if;
  if not exists (select 1 from deal_move m
                  where m.from_state = r.state and m.to_state = p_to
                    and m.role = rol) then
    raise exception '이 상태로 바꿀 권한이 없습니다 — %', rol;
  end if;

  update request_item set state = p_to where id = p_item;

  insert into audit_log (by_user, by_role, obj, obj_id,
                         from_state, to_state, why, data)
  values (uid, rol, 'request_item', p_item::text,
          r.state::text, p_to::text, p_why,
          jsonb_build_object('service_id', r.service_id,
                             'request_id', r.request_id));
end $$;
revoke all on function move_item_state(uuid, deal_state, text) from public;
grant execute on function move_item_state(uuid, deal_state, text) to authenticated;


-- 판 번호 (db/README.md) — ⚠️ 칸 이름은 0002 의 것입니다 (n · name)
insert into schema_version (n, name) values (9, '0009_request_item')
on conflict (n) do nothing;

commit;
