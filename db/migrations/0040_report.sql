-- ════════════════════════════════════════════════════════════════════
-- 0040 — 신고 · 분쟁  [3차 지시서 §6 · §8 · §9 abuse_reports]
-- ════════════════════════════════════════════════════════════════════
-- ⚠️⚠️⚠️ **`deal_state` enum 에 'disputed' 를 더하지 않았습니다 —
--   일부러입니다.** 까닭 둘:
--
--   ① **터집니다.** `alter type ... add value` 로 더한 값은 **같은
--      트랜잭션에서 쓸 수 없습니다.** 우리 마이그레이션은 전부
--      `begin; … commit;` 으로 감싸여 있어서, 그 안에서 더하고 바로
--      쓰면 `unsafe use of new value` 로 멈춥니다. 임시 Postgres 에
--      실제로 돌려 보고 확인했습니다. 트랜잭션 밖으로 빼면 되지만,
--      사장님은 `db/apply-from-0008.sql` 을 **통째로** 붙여 넣으시고
--      그 편집기가 전체를 한 트랜잭션으로 감싸는지 저희는 모릅니다.
--      **모르는 것에 기대지 않습니다.**
--
--   ② **더 중요한 까닭 — 분쟁은 단계가 아닙니다.** 상태로 만들면
--      `signed` 였는지 `done` 이었는지가 **덮여서 사라집니다.** 분쟁은
--      어느 단계에서든 열릴 수 있고, 풀리면 원래 단계로 돌아가야
--      합니다. 그래서 **따로 적습니다** (3차 지시서 §6 은 상태로
--      적었지만, 우리 deal_state 가 그보다 자세해서 그렇습니다 —
--      AUDIT.md 에 적어 두었습니다).
--
-- ⚠️⚠️ **신고와 분쟁을 한 표에 둡니다.** 둘 다 "누가 · 무엇을 ·
--   왜 · 어떻게 끝났나" 이고, 관리자는 한 자리에서 봅니다 (§8).
--   `kind` 로 가릅니다.
--
-- ⚠️ **지우지 않습니다.** 신고를 지우면 "신고한 적 없다" 가 됩니다.
--   끝난 것은 state 로 표시합니다.
-- ════════════════════════════════════════════════════════════════════
begin;

create table if not exists report (
  id          uuid primary key default gen_random_uuid(),
  -- abuse  신고 (욕설 · 허위 · 광고 등)
  -- dispute 분쟁 (거래가 틀어졌습니다)
  kind        text not null check (kind in ('abuse','dispute')),
  -- ⚠️ 무엇에 대한 것인가 — 셋 가운데 **적어도 하나**는 있어야 합니다.
  --   셋 다 비면 무엇을 신고한 것인지 알 수 없습니다.
  request_id  uuid references request(id)  on delete cascade,
  provider_id text references provider(id) on delete cascade,
  review_id   uuid references review(id)   on delete cascade,
  by_user     uuid references auth.users(id) on delete set null,
  body        text not null,
  state       text not null default 'open'
              check (state in ('open','reviewing','resolved','rejected')),
  -- 어떻게 끝났나 — ⚠️ 끝낼 때는 반드시 적습니다
  resolution  text,
  closed_at   timestamptz,
  closed_by   uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint report_target_ck check (
    request_id is not null or provider_id is not null or review_id is not null),
  constraint report_body_ck check (char_length(btrim(body)) between 5 and 2000),
  -- ⚠️⚠️ 끝난 것에는 **까닭이 반드시** 있습니다. 문에서도 받고 여기서도
  --   봅니다 — 문이 내려가는 날 이 줄이 남습니다.
  constraint report_resolution_ck check (
    state not in ('resolved','rejected')
    or btrim(coalesce(resolution,'')) <> '')
);
create index if not exists report_state_idx on report (state, created_at desc);
create index if not exists report_target_idx on report (provider_id, request_id);

alter table report enable row level security;

-- ── 누가 보는가 ─────────────────────────────────────────────────────
-- ⚠️⚠️ **신고한 사람은 제 신고만 봅니다.** 남의 신고가 보이면 누가
--   누구를 신고했는지 드러납니다 — 그 자체가 분쟁의 씨앗입니다.
drop policy if exists report_mine on report;
create policy report_mine on report for select
  using (by_user = auth.uid());

drop policy if exists report_staff on report;
create policy report_staff on report for select
  using (my_role() in ('staff','admin'));

-- ⚠️⚠️ **업체는 제게 들어온 신고를 못 봅니다.** 보면 신고한 손님을
--   찾아갑니다. 운영자가 걸러서 전합니다 — 그게 중개자가 할 일입니다.
-- ⚠️ 쓰기 정책을 일부러 안 만들었습니다 — 문 둘만 엽니다.
grant select on report to authenticated;


-- ════════════════════════════════════════════════════════════════════
-- ① 문 — 신고 · 분쟁을 엽니다
--
-- ⚠️ 로그인한 사람만입니다. 익명 신고를 받으면 경쟁사가 하루에 백 건을
--   넣습니다 — 받을 수는 있어도 **누가 넣었는지는 알아야** 합니다.
-- ════════════════════════════════════════════════════════════════════
create or replace function open_report(p jsonb)
  returns uuid language plpgsql security definer
  set search_path = public as $$
declare
  v_me   uuid := auth.uid();
  v_kind text := coalesce(nullif(btrim(p->>'kind'), ''), 'abuse');
  v_req  uuid := nullif(btrim(coalesce(p->>'request', '')), '')::uuid;
  v_pv   text := nullif(btrim(coalesce(p->>'provider', '')), '');
  v_rv   uuid := nullif(btrim(coalesce(p->>'review', '')), '')::uuid;
  v_body text := btrim(coalesce(p->>'body', ''));
  v_id   uuid;
  v_dup  int;
begin
  if v_me is null then raise exception '신고는 로그인한 뒤에 하실 수 있습니다'; end if;
  if v_kind not in ('abuse','dispute') then
    raise exception '신고 · 분쟁 중 하나로 적어 주세요';
  end if;
  if v_req is null and v_pv is null and v_rv is null then
    raise exception '무엇에 대한 것인지 적어 주세요 (요청 · 업체 · 후기 가운데 하나)';
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
     and review_id is not distinct from v_rv;
  if v_dup > 0 then
    raise exception '같은 건으로 이미 접수된 것이 있습니다 — 운영자가 보고 있습니다';
  end if;

  insert into report (kind, request_id, provider_id, review_id, by_user, body)
  values (v_kind, v_req, v_pv, v_rv, v_me, v_body)
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
-- ② 문 — 운영자가 처리합니다
--
-- ⚠️⚠️ **끝낼 때는 어떻게 끝났는지 반드시 적습니다** (§8 의 "승인 ·
--   거절 사유 필수"). 까닭 없이 닫을 수 있으면, 신고함은 쌓이기만
--   하는 자리가 됩니다.
-- ════════════════════════════════════════════════════════════════════
create or replace function move_report(p jsonb)
  returns void language plpgsql security definer
  set search_path = public as $$
declare
  v_me   uuid := auth.uid();
  v_role app_role := my_role();
  v_id   uuid := nullif(btrim(coalesce(p->>'id', '')), '')::uuid;
  v_to   text := nullif(btrim(coalesce(p->>'to', '')), '');
  v_res  text := nullif(btrim(coalesce(p->>'resolution', '')), '');
  r      report%rowtype;
begin
  if v_me is null then raise exception '변경자를 알 수 없습니다'; end if;
  if not coalesce(v_role in ('staff','admin'), false) then
    raise exception '신고 처리는 운영자만 할 수 있습니다';
  end if;
  if v_id is null then raise exception '어느 신고인지 적어 주세요'; end if;
  if v_to not in ('reviewing','resolved','rejected') then
    raise exception '신고는 확인 중 · 처리됨 · 반려로만 옮깁니다';
  end if;

  select * into r from report where id = v_id;
  if not found then raise exception '그런 신고가 없습니다'; end if;
  if r.state = v_to then raise exception '이미 %입니다', v_to; end if;
  if r.state in ('resolved','rejected') then
    raise exception '이미 끝난 신고입니다';
  end if;
  if v_to in ('resolved','rejected') and v_res is null then
    raise exception '어떻게 처리하셨는지 적어 주세요';
  end if;

  update report set
    state      = v_to,
    resolution = case when v_to in ('resolved','rejected') then v_res else resolution end,
    closed_at  = case when v_to in ('resolved','rejected') then now() else null end,
    closed_by  = case when v_to in ('resolved','rejected') then v_me else null end,
    updated_at = now()
   where id = v_id;

  insert into audit_log (by_user, by_role, obj, obj_id, from_state, to_state, why)
  values (v_me, v_role, 'report', v_id::text, r.state, v_to, v_res);
end $$;

revoke all on function move_report(jsonb) from public;
grant execute on function move_report(jsonb) to authenticated;

insert into schema_version (n, name) values (40, '0040_report')
on conflict (n) do nothing;

commit;
