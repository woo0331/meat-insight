-- ════════════════════════════════════════════════════════════════════
-- 0039 — 요청 취소 · 제3자 제공 동의 **철회**
--        [3차 지시서 §5 · 개인정보 보호법 제37조 · 제17조 제2항]
-- ════════════════════════════════════════════════════════════════════
-- ⚠️⚠️⚠️ **철회할 길이 없었습니다.** 0029 가 "배정하는 순간 상호를
--   알리고 동의를 다시 받는다" 까지는 제대로 했는데, 그 뒤가 없습니다.
--   `assignment.agree3rd_at` 은 **언제 동의했나**만 적혀 있고
--   **아무 자물쇠도 그 칸을 보지 않습니다.**
--
--   업체가 손님 정보를 보는 길이 셋인데 전부 "배정 줄이 있는가" 만
--   봅니다 —
--     request_assigned  정책 (0001)  성함 · 연락처
--     is_my_item()      함수 (0009)  무엇을 요청했나
--     photo_provider    정책 (0011)  올린 사진 · 서류
--   즉 손님이 "그 업체에는 주지 마세요" 라고 할 방법이 없었고, 말해도
--   **업체는 계속 다 봤습니다.** 제37조(처리정지 요구권)가 걸리는
--   자리입니다.
--
-- ⚠️⚠️ **배정 줄을 지우지 않습니다.** 지우면 "준 적 없다" 가 되어
--   **넘어간 적이 있다는 기록 자체가 사라집니다.** 제공 이력은 손님이
--   확인할 수 있어야 하는 것이고(§5), 업체 쪽에도 왜 끊겼는지가
--   남아야 합니다. 그래서 **표시**합니다.
--
-- ⚠️⚠️ **일부러 안 끊는 것 둘 — 까닭이 있습니다.**
--   · 업체가 **이미 낸 견적**은 남습니다. 철회는 "앞으로 못 본다" 이지
--     "없던 일" 이 아닙니다. 손님도 받아 둔 견적을 계속 봅니다.
--   · **수수료 · 정산 기록**도 남습니다 (회계 · 세무 기록입니다).
--
-- ⚠️⚠️ **덮어쓰는 것 셋** — 앞 번호를 다시 붙여 넣으면 조용히 내려갑니다:
--     request_assigned 정책   0001 → **0039**
--     is_my_item()            0009 → **0039**
--     photo_provider 정책     0011 → **0039**
--   내려갔는지 보는 법:
--     select pg_get_functiondef('is_my_item(uuid)'::regprocedure)
--            like '%revoked_at%';     -- false 면 0009 판입니다
-- ════════════════════════════════════════════════════════════════════
begin;

alter table assignment add column if not exists revoked_at  timestamptz;
alter table assignment add column if not exists revoked_why text;

create index if not exists assign_revoked_idx on assignment (request_id, revoked_at);

-- ⚠️ 철회에는 **까닭을 받습니다** — 업체가 왜 끊겼는지 알아야 하고,
--   나중에 다툼이 생기면 그 글이 기록입니다.
do $$ begin
  alter table assignment add constraint assign_revoked_why_ck
    check (revoked_at is null or btrim(coalesce(revoked_why,'')) <> '');
exception when duplicate_object then null; end $$;


-- ════════════════════════════════════════════════════════════════════
-- ① 업체가 보는 길 셋을 **전부** 좁힙니다
--
-- ⚠️⚠️ 셋을 **각각** 고칩니다. 하나만 고치면 나머지 둘로 계속 봅니다 —
--   성함을 못 봐도 사진으로 알 수 있고, 사진을 못 봐도 요청 내용으로
--   알 수 있습니다. 끊으려면 다 끊어야 합니다.
-- ════════════════════════════════════════════════════════════════════
drop policy if exists request_assigned on request;
create policy request_assigned on request for select using (
  exists (select 1 from assignment a
          where a.request_id = request.id
            and a.provider_id = my_provider()
            and a.revoked_at is null)
);

create or replace function is_my_item(iid uuid) returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (select 1 from assignment a
                  where a.item_id = iid
                    and a.provider_id = my_provider()
                    and a.revoked_at is null)
$$;
revoke all on function is_my_item(uuid) from public;
grant execute on function is_my_item(uuid) to authenticated;

drop policy if exists photo_provider on request_photo;
create policy photo_provider on request_photo for select
  using (my_provider() is not null and exists (
    select 1 from assignment a
     where a.request_id = request_photo.request_id
       and a.provider_id = my_provider()
       and a.revoked_at is null));


-- ════════════════════════════════════════════════════════════════════
-- ② 철회한 업체는 **새 견적 · 새 일정도 못 냅니다**
--
-- ⚠️ `submit_quote`(0008) · `set_appointment`(0034)를 고치지 않습니다 —
--   긴 함수를 덮어쓰면 앞 번호를 다시 붙여 넣는 날 이 자물쇠가 조용히
--   내려갑니다 (0038 에서 쓴 방식 그대로). 표에 트리거를 답니다.
-- ⚠️⚠️ **넣을 때만** 봅니다. 손님이 이미 받은 견적을 고르는 것(update)
--   까지 막으면, 철회했다고 손님이 받아 둔 견적이 잠깁니다.
-- ════════════════════════════════════════════════════════════════════
create or replace function assign_not_revoked() returns trigger
  language plpgsql security definer set search_path = public as $$
declare rv timestamptz;
begin
  select revoked_at into rv from assignment
   where request_id = new.request_id and provider_id = new.provider_id;
  if rv is not null then
    raise exception '손님이 이 업체로의 정보 제공을 철회했습니다 — 더 진행할 수 없습니다';
  end if;
  return new;
end $$;

drop trigger if exists quote_not_revoked_t on quote;
create trigger quote_not_revoked_t before insert on quote
  for each row execute function assign_not_revoked();

drop trigger if exists appt_not_revoked_t on appointment;
create trigger appt_not_revoked_t before insert on appointment
  for each row execute function assign_not_revoked();


-- ════════════════════════════════════════════════════════════════════
-- ③ 문 — 손님이 **철회**합니다
--
-- ⚠️⚠️ 손님만입니다. 운영자가 대신 철회하면 "손님이 원해서" 인지
--   "운영자가 치워서" 인지 기록에서 갈리지 않습니다.
-- ⚠️ 이미 철회한 것을 또 철회하면 **다른 말로** 거절합니다.
-- ════════════════════════════════════════════════════════════════════
create or replace function revoke_third_party(p jsonb)
  returns void language plpgsql security definer
  set search_path = public as $$
declare
  v_me  uuid := auth.uid();
  v_id  uuid := nullif(btrim(coalesce(p->>'assignment', '')), '')::uuid;
  v_why text := nullif(btrim(coalesce(p->>'why', '')), '');
  r     assignment%rowtype;
begin
  if v_me is null then raise exception '철회는 로그인한 뒤에 하실 수 있습니다'; end if;
  if v_id is null then raise exception '어느 업체로의 제공을 철회하실지 적어 주세요'; end if;

  select * into r from assignment where id = v_id;
  if not found then raise exception '그런 제공 기록이 없습니다'; end if;
  -- ⚠️⚠️ coalesce 로 땅에 내려놓습니다 — NULL 이면 if 가 안 걸려
  --   자물쇠가 통째로 열립니다 (0034 에서 겪은 자리).
  if not coalesce(is_my_request(r.request_id), false) then
    raise exception '내 요청의 제공만 철회할 수 있습니다';
  end if;
  if r.revoked_at is not null then
    raise exception '이미 철회하셨습니다';
  end if;
  if v_why is null then
    raise exception '철회하시는 까닭을 적어 주세요 (업체가 왜 끊겼는지 알아야 합니다)';
  end if;

  update assignment set revoked_at = now(), revoked_why = v_why where id = v_id;

  -- ⚠️ 감사 기록에 **성함 · 연락처를 안 넣습니다** — 요청 id 로 찾아갑니다.
  insert into audit_log (by_user, by_role, obj, obj_id, from_state, to_state, why, data)
  values (v_me, my_role(), 'assignment', v_id::text, r.state, 'revoked', v_why,
          jsonb_build_object('request_id', r.request_id, 'provider_id', r.provider_id));
end $$;

revoke all on function revoke_third_party(jsonb) from public;
grant execute on function revoke_third_party(jsonb) to authenticated;


-- ════════════════════════════════════════════════════════════════════
-- ④ 문 — 손님이 **요청을 취소**합니다
--
-- ⚠️⚠️ **이미 계약 단계면 막습니다.** 업체가 일을 시작했을 수 있고,
--   그때 손님이 혼자 취소하면 그 다툼을 플랫폼이 떠안습니다 —
--   담당자를 거치게 합니다. 화면도 그렇게 말합니다.
-- ⚠️ 취소는 `move_state`(0004→0007)의 길을 쓰지 않습니다. 그 문은
--   **운영자용**이고 전이표(deal_move)를 따릅니다 — 손님이 쓰는 길은
--   따로 두는 것이 맞습니다 (권한이 다릅니다).
-- ⚠️⚠️ 취소해도 **배정 · 견적을 지우지 않습니다.** 기록입니다.
--   다만 취소하면 **제공도 전부 철회**됩니다 — 요청을 거둔 손님의
--   연락처를 업체가 계속 볼 까닭이 없습니다.
-- ════════════════════════════════════════════════════════════════════
create or replace function cancel_request(p jsonb)
  returns void language plpgsql security definer
  set search_path = public as $$
declare
  v_me  uuid := auth.uid();
  v_id  uuid := nullif(btrim(coalesce(p->>'request', '')), '')::uuid;
  v_why text := nullif(btrim(coalesce(p->>'why', '')), '');
  r     request%rowtype;
  n     int;
begin
  if v_me is null then raise exception '취소는 로그인한 뒤에 하실 수 있습니다'; end if;
  if v_id is null then raise exception '어느 요청인지 적어 주세요'; end if;

  select * into r from request where id = v_id;
  if not found then raise exception '그런 요청이 없습니다'; end if;
  if not coalesce(is_my_request(v_id), false) then
    raise exception '내 요청만 취소할 수 있습니다';
  end if;
  if r.state = 'lost' then raise exception '이미 취소된 요청입니다'; end if;
  -- ⚠️⚠️ 계약 뒤에는 혼자 못 거둡니다 — 거절하는 말이 **무엇을 하라고**
  --   말해 줍니다 (막다른 길로 두지 않습니다).
  if r.state in ('signed','done','fee_wait','fee_done') then
    raise exception '이미 진행 중인 건이라 혼자 취소할 수 없습니다 — 고객센터로 알려 주세요';
  end if;
  if v_why is null then
    raise exception '취소하시는 까닭을 적어 주세요';
  end if;

  update request set state = 'lost' where id = v_id;

  -- ⚠️ 넘어가 있던 제공을 **전부** 거둡니다 (이미 철회한 것은 그대로).
  update assignment
     set revoked_at = now(),
         revoked_why = '손님이 요청을 취소했습니다'
   where request_id = v_id and revoked_at is null;
  get diagnostics n = row_count;

  insert into audit_log (by_user, by_role, obj, obj_id, from_state, to_state, why, data)
  values (v_me, my_role(), 'request', v_id::text, r.state::text, 'lost', v_why,
          jsonb_build_object('revoked', n));
end $$;

revoke all on function cancel_request(jsonb) from public;
grant execute on function cancel_request(jsonb) to authenticated;

insert into schema_version (n, name) values (39, '0039_consent_revoke')
on conflict (n) do nothing;

commit;
