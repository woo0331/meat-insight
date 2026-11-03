-- ════════════════════════════════════════════════════════════════════
-- 0022 · 앞 서비스(창업 · 폐업) 접수를 **보관 표시**로 내려놓습니다
--   2026-11-02 · 전환 지시서 §6 — "삭제 작업은 가능한 경우 복구 가능한
--   마이그레이션으로 관리한다"
--
-- 지우는 것이 **한 줄도 없습니다.** 칸도 · 줄도 · 기록도 그대로 두고,
-- `request` 에 표시 두 칸을 더해 **목록에서만 내려놓습니다.**
--
-- ⚠️⚠️ **왜 "보관 표로 옮기기" 가 아닌가 — 재서 바꿨습니다.**
--   처음 적어 둔 계획은 옛 접수를 보관 표로 **옮기는** 것이었습니다.
--   그런데 `request(id)` 를 가리키는 외래키가 **여섯**이고 다섯이
--   `on delete cascade` 입니다 —
--
--     assignment · deal · quote · request_item · request_photo  (cascade)
--     device                                                   (set null)
--
--   줄을 옮긴다는 것은 `request` 에서 지운다는 뜻이고, 그러면 그 건의
--   **배정 · 계약 · 수수료 · 입찰 · 사진이 같이 사라집니다.** §8 이
--   "모든 중요한 상태 변경을 기록한다" 고 적어 둔 그 기록이 통째로
--   없어지는 것이라, 복구 가능한 마이그레이션이 아니라 **제일 비싼
--   파괴**였습니다. 그래서 **옮기지 않고 표시합니다.**
--
-- ⚠️⚠️ **스냅샷 보관 표도 만들지 않았습니다.** 옛 줄을 통째로 베껴
--   두면 성함 · 연락처가 **두 번 보관**됩니다 — 이 저장소가 감사 기록과
--   `note_request_open` 에서 "기록은 못 지우는 것이라 그 자체가 또
--   하나의 보관입니다" 로 두 번 적어 둔 자리입니다. 원본 줄이 그대로
--   남아 있으니 베낄 까닭도 없습니다.
--
-- ⚠️⚠️ **`request.industry` 는 한 글자도 안 건드립니다.** 그 칸은
--   버려진 것이 아니라 **뜻이 바뀐** 칸입니다 — 2026-10-31 로 중고폰
--   **기기 종류**를 담고 `api/me.js` 의 역할 넷이 전부 가져갑니다
--   (`/my` 의 `myCond()` · `/admin` 의 거르개 · 업체 칸의 "취급 기기").
--   지우면 PostgREST 가 없는 칸을 달라고 해서 `/my` 와 `/admin` 접수
--   목록이 **통째로 안 그려집니다.**
--
-- 되돌리는 법 ───────────────────────────────────────────────────────
--   한 건      select restore_legacy_request('SW-XXXX-XXXX', '까닭');
--   전부       update request set archived_at = null, archived_why = null;
--   칸까지     alter table request drop column archived_at, drop column archived_why;
--
-- ⚠️ 두 번 돌려도 안전합니다 (add column if not exists · create or replace).
-- ⚠️⚠️ 돌린 파일을 **고치지 않았습니다** — 다음 번호로 새로 만듭니다.
-- ════════════════════════════════════════════════════════════════════

begin;

-- ════════════════════════════════════════════════════════════════════
-- ① 보관 표시 두 칸
--
-- ⚠️⚠️ **사유 없는 보관은 기록이 아닙니다** (§8). 시각만 찍히고 왜
--   내려놓았는지가 없으면, 반 년 뒤에 그 건을 보는 사람이 "이게 왜
--   목록에 없지" 를 아무 데서도 못 읽습니다 — 0014 의
--   `request_notify_at_ok`(동의했다면 시각이 있어야 한다)와 같은 선입니다.
-- ════════════════════════════════════════════════════════════════════
alter table request add column if not exists archived_at  timestamptz;
alter table request add column if not exists archived_why text;

alter table request drop constraint if exists request_archived_why_ok;
alter table request add constraint request_archived_why_ok
  check (archived_at is null or btrim(coalesce(archived_why, '')) <> '');

-- ⚠️⚠️ **쓰기 권한을 주지 않습니다.** 0001 의 GRANT 가 칸 단위라, 안
--   더하면 그대로 닫혀 있습니다 — 바꾸는 길은 아래 문 둘뿐입니다
--   (`verified` · `listed` · `inhouse` 와 같은 선).


-- ════════════════════════════════════════════════════════════════════
-- ② 보관하는 문 — 관리자만 (`archive_legacy_side`)
--
-- 앞 서비스의 `side` 넷(start · ops · transfer · close)을 가진 접수를
-- 한 번에 내려놓습니다. 중고폰 쪽 값(buyin · bid · export · repair)은
-- **건드리지 않습니다.**
--
-- ⚠️⚠️ **돈이 안 끝난 건은 두고 갑니다.** 수수료를 확정해 두고 아직
--   입금이 안 된 건을 목록에서 내리면 **미수금이 화면에서 사라집니다** —
--   이 저장소가 "미수금은 확정된 건만 센다" 로 겪은 자리의 반대쪽이고,
--   §13 이 금지한 가짜 정산과 결이 같습니다. 그런 건은 세어서
--   돌려주고 사람이 먼저 정산하게 둡니다.
-- ⚠️ 돌려주는 값이 **둘**입니다 — 내려놓은 수와 **두고 온 수**. 두고 온
--   것을 안 세면 "다 됐다" 로 읽히고, 남은 건은 아무도 안 봅니다.
-- ⚠️⚠️ 기록과 표시가 **한 트랜잭션**입니다 — 기록이 실패하면 표시도
--   안 붙습니다 (§8 · 0003 · 0004 와 같은 규칙).
-- ════════════════════════════════════════════════════════════════════
create or replace function archive_legacy_side(p_why text)
  returns jsonb
  language plpgsql security definer set search_path = public as $$
declare
  v_me   uuid     := auth.uid();
  v_role app_role := my_role();
  v_why  text     := nullif(btrim(coalesce(p_why, '')), '');
  v_done int      := 0;
  v_kept int      := 0;
begin
  if v_me is null then
    raise exception '변경자를 알 수 없습니다 — 로그인한 세션에서만 됩니다';
  end if;
  if v_role <> 'admin' then
    raise exception '보관은 관리자만 할 수 있습니다';
  end if;
  if v_why is null then
    raise exception '보관 사유를 적어 주세요 — 사유 없는 보관은 기록이 아닙니다';
  end if;

  /* 돈이 안 끝난 건 — 세어만 두고 지나갑니다 */
  select count(*) into v_kept
    from request r
   where r.side in ('start', 'ops', 'transfer', 'close')
     and r.archived_at is null
     and exists (select 1 from deal d
                  where d.request_id = r.id
                    and d.fee_at is not null
                    and d.paid_at is null);

  with moved as (
    update request r
       set archived_at = now(), archived_why = v_why
     where r.side in ('start', 'ops', 'transfer', 'close')
       and r.archived_at is null
       and not exists (select 1 from deal d
                        where d.request_id = r.id
                          and d.fee_at is not null
                          and d.paid_at is null)
    returning r.id, r.state
  ), logged as (
    /* ⚠️ 기록에 성함 · 연락처를 안 적습니다 — 감사 기록은 못 지우는
       것이라 거기 번호를 박으면 그 자체가 또 하나의 보관입니다
       (`note_request_open` · `save_provider_contact` 와 같은 규칙). */
    insert into audit_log (by_user, by_role, obj, obj_id, from_state, to_state, why)
    select v_me, v_role, 'request', m.id::text, m.state::text, 'archived', v_why
      from moved m
    returning 1
  )
  select count(*)::int into v_done from logged;

  return jsonb_build_object('archived', v_done, 'kept', v_kept);
end $$;


-- ════════════════════════════════════════════════════════════════════
-- ③ 되돌리는 문 — 관리자만 (`restore_legacy_request`)
--
-- ⚠️⚠️ **한 건씩입니다.** 통째로 되돌리는 문을 만들면 잘못 누른 날
--   손볼 자리가 없습니다 — 전부 되돌리시려면 머리말의 `update` 한 줄을
--   쓰시면 되고, 그건 사람이 한 번 더 생각하고 치는 길입니다.
-- ⚠️ 신청번호(`no`)로 받습니다 — 관리자가 손에 들고 있는 값은 uuid 가
--   아니라 접수번호입니다 (`claim_request` 와 같은 선).
-- ════════════════════════════════════════════════════════════════════
create or replace function restore_legacy_request(p_no text, p_why text)
  returns request
  language plpgsql security definer set search_path = public as $$
declare
  v_me   uuid     := auth.uid();
  v_role app_role := my_role();
  v_why  text     := nullif(btrim(coalesce(p_why, '')), '');
  v_rq   request;
begin
  if v_me is null then
    raise exception '변경자를 알 수 없습니다 — 로그인한 세션에서만 됩니다';
  end if;
  if v_role <> 'admin' then
    raise exception '보관을 되돌리는 것은 관리자만 할 수 있습니다';
  end if;
  if v_why is null then
    raise exception '되돌리는 사유를 적어 주세요';
  end if;

  update request
     set archived_at = null, archived_why = null
   where no = btrim(coalesce(p_no, ''))
     and archived_at is not null
   returning * into v_rq;

  /* ⚠️ 없는 번호와 **이미 안 보관된 번호**를 가르지 않습니다 — 한 가지
     말로만 거절합니다 (0005 의 `claim_request` 와 같은 까닭: 갈라 주면
     번호가 있는지를 확인해 가며 긁을 수 있습니다). */
  if v_rq.id is null then
    raise exception '보관된 신청을 찾지 못했습니다 — 신청번호를 확인해 주세요';
  end if;

  insert into audit_log (by_user, by_role, obj, obj_id, from_state, to_state, why)
  values (v_me, v_role, 'request', v_rq.id::text, 'archived', v_rq.state::text, v_why);

  return v_rq;
end $$;


revoke all on function archive_legacy_side(text) from public;
revoke all on function restore_legacy_request(text, text) from public;
grant execute on function archive_legacy_side(text) to authenticated;
grant execute on function restore_legacy_request(text, text) to authenticated;


insert into schema_version (n, name) values (22, '0022_legacy_archive')
on conflict (n) do nothing;

commit;
