-- ════════════════════════════════════════════════════════════════════
-- 0034 — 상담 예약 · 일정 (2차 지시서 §7)
-- ════════════════════════════════════════════════════════════════════
-- ⚠️⚠️ **왜 필요한가.** 지금은 업체가 수락하고 "상담 중" 으로 넘기면
--   그 뒤가 **전화기 안에만** 있습니다. 손님은 언제 만나기로 했는지
--   화면에서 볼 길이 없고, 운영자는 그 건이 살아 있는지 모릅니다.
--
-- ⚠️⚠️ **알림을 보내지 않습니다.** 문자 · 카톡을 붙이지 않았으므로
--   "예약하면 알려 드립니다" 라고 **말하지 않습니다** (절대 규칙 5).
--   여기가 하는 일은 **적어 두고 서로 같은 것을 보는 것**까지입니다.
--   ⚠️ 알림을 붙이시는 날은 정보통신망법 제50조입니다 — (광고) 표기가
--   아니라 거래 안내라도 **보내는 사람 · 수신거부**는 적어야 하고,
--   발송사를 쓰면 방침에 수탁자를 **같은 날** 적어야 합니다 (제26조).
--
-- ⚠️⚠️ **잡는 사람은 업체입니다** (손님이 아니라). 업체의 일정은
--   업체가 압니다 — 손님이 아무 때나 잡게 두면 업체가 못 가는 시각이
--   잡히고, 그건 플랫폼이 한 약속이 됩니다. 손님은 **보고 · 거절**
--   합니다 (거절은 상태로 남습니다).
--
-- ⚠️ 한 요청에 **업체마다 하나**입니다. 여러 줄을 쌓으면 "어느 것이
--   지금 약속인가" 가 갈립니다 — 바꾸면 그 줄을 덮어쓰고, 바꾼 기록은
--   `audit_log` 에 남습니다 (문이 하나라서).
--
-- ⚠️⚠️ **시각은 timestamptz 입니다.** 날짜만 적으면 "11월 5일 몇 시" 가
--   사라집니다. ⚠️ 보여 줄 때는 **한국 시각**으로 봅니다 — Supabase 는
--   UTC 라 그냥 찍으면 아홉 시간 어긋납니다.
-- ════════════════════════════════════════════════════════════════════
begin;

create table if not exists appointment (
  id          uuid primary key default gen_random_uuid(),
  request_id  uuid not null references request(id) on delete cascade,
  provider_id text not null references provider(id) on delete cascade,
  at          timestamptz not null,
  -- 어디서 만나나 — ⚠️ 글자가 아니라 **정해진 셋**입니다
  --   js/data/deal.js 의 AM_APPT_KIND 와 같아야 하고, 빌드가 맞춰 봅니다.
  kind        text not null default 'visit'
              check (kind in ('visit','call','online')),
  place       text,                       -- 매장 주소 · 연습장 이름 등
  note        text,
  -- set 잡힘 · done 만났음 · cancel 취소
  state       text not null default 'set'
              check (state in ('set','done','cancel')),
  why         text,                       -- 취소 · 변경 사유
  by_user     uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (request_id, provider_id),
  constraint appt_place_len check (place is null or length(place) <= 200),
  constraint appt_note_len  check (note  is null or length(note)  <= 1000)
);
create index if not exists appt_at_idx on appointment (at desc);

alter table appointment enable row level security;

-- ── 누가 보는가 ─────────────────────────────────────────────────────
-- ⚠️⚠️ 정책 안에서 `request` 를 바로 읽으면 무한 재귀입니다 (0005 ·
--   0008 · 0011 에서 겪은 자리) — `is_my_request()` 로 끊습니다.
drop policy if exists appt_mine on appointment;
create policy appt_mine on appointment for select
  using (is_my_request(request_id));

drop policy if exists appt_provider on appointment;
create policy appt_provider on appointment for select
  using (provider_id = my_provider());

drop policy if exists appt_staff on appointment;
create policy appt_staff on appointment for select
  using (my_role() in ('staff','admin'));

-- ⚠️⚠️ **쓰기 정책을 일부러 만들지 않았습니다.** RLS 는 정책이 없으면
--   막습니다 — 쓰는 길은 아래 문 둘뿐입니다 (0008 과 같은 규칙).
grant select on appointment to authenticated;


-- ════════════════════════════════════════════════════════════════════
-- ① 업체가 일정을 잡습니다 · 고칩니다
--
-- ⚠️⚠️ **배정을 수락한 업체만**입니다. `submit_quote`(0008)와 **같은
--   말로** 거절하면 어느 자물쇠인지 알 수 없으니, 거절하는 글을
--   그 자리에 맞게 적습니다.
-- ⚠️ 상태를 여기서 바꾸지 않습니다 — 상태의 문은 `move_state()` 하나
--   입니다 (0004). 일정은 상담의 **부속**이지 상태가 아닙니다.
-- ════════════════════════════════════════════════════════════════════
create or replace function set_appointment(p jsonb)
  returns uuid language plpgsql security definer
  set search_path = public as $$
declare
  v_me   uuid := auth.uid();
  v_pv   text := my_provider();
  v_req  uuid;
  v_as   text;
  v_st   deal_state;
  v_at   timestamptz;
  v_kind text := coalesce(nullif(btrim(p->>'kind'), ''), 'visit');
  v_id   uuid;
  v_was  text;
begin
  if v_me is null then
    raise exception '변경자를 알 수 없습니다 — 로그인한 세션에서만 됩니다';
  end if;
  if my_role() <> 'provider' or v_pv is null then
    raise exception '일정은 배정받은 업체가 잡습니다';
  end if;

  v_req := nullif(btrim(coalesce(p->>'request', '')), '')::uuid;
  if v_req is null then raise exception '어느 요청인지 적어 주세요'; end if;

  select state into v_st from request where id = v_req;
  if v_st is null then raise exception '없는 신청입니다'; end if;

  select state into v_as from assignment
   where request_id = v_req and provider_id = v_pv;
  if v_as is null then raise exception '이 신청에 배정되지 않았습니다'; end if;
  if v_as <> 'accepted' then raise exception '배정을 먼저 수락해 주세요'; end if;

  -- ⚠️⚠️ 끝난 건에는 안 잡습니다. 진행 안 함 · 보류에 일정이 붙으면
  --   손님 화면에 **살아 있는 약속**처럼 보입니다.
  if v_st in ('lost','hold') then
    raise exception '지금 상태(%)에서는 일정을 잡을 수 없습니다', v_st;
  end if;

  begin
    v_at := (p->>'at')::timestamptz;
  exception when others then
    raise exception '만나실 때를 다시 확인해 주세요';
  end;
  if v_at is null then raise exception '언제 만나실지 적어 주세요'; end if;
  -- ⚠️⚠️ **경계값.** 어제로 잡는 것은 오타입니다 (2025년으로 찍히는
  --   사고가 여기서 납니다). 하루 전까지는 봐줍니다 — 어젯밤 통화로
  --   정한 오늘 아침 약속을 오늘 적는 일이 있습니다.
  if v_at < now() - interval '1 day' then
    raise exception '지난 때로는 잡을 수 없습니다 — 날짜를 다시 봐 주세요';
  end if;
  -- ⚠️ 너무 넓게 막는 것도 고장입니다. 두 해 뒤까지는 둡니다.
  if v_at > now() + interval '2 years' then
    raise exception '너무 먼 때입니다 — 날짜를 다시 봐 주세요';
  end if;
  if v_kind not in ('visit','call','online') then
    raise exception '만나는 방법을 방문 · 통화 · 비대면 중에서 골라 주세요';
  end if;

  select state into v_was from appointment
   where request_id = v_req and provider_id = v_pv;

  insert into appointment (request_id, provider_id, at, kind, place, note,
                           state, by_user, updated_at)
  values (v_req, v_pv, v_at, v_kind,
          nullif(btrim(coalesce(p->>'place', '')), ''),
          nullif(btrim(coalesce(p->>'note', '')), ''),
          'set', v_me, now())
  on conflict (request_id, provider_id) do update
    set at = excluded.at, kind = excluded.kind, place = excluded.place,
        note = excluded.note, state = 'set', why = null,
        by_user = v_me, updated_at = now()
  returning id into v_id;

  -- ⚠️ 감사 기록에 **성함 · 연락처를 넣지 않습니다** — 요청 id 로
  --   찾아갑니다. ⚠️ `place` 도 안 넣습니다 (가게 주소입니다).
  insert into audit_log (by_user, by_role, obj, obj_id, from_state, to_state, data)
  values (v_me, 'provider', 'appointment', v_id::text,
          coalesce(v_was, 'none'), 'set',
          jsonb_build_object('kind', v_kind, 'request_id', v_req));
  return v_id;
end $$;


-- ════════════════════════════════════════════════════════════════════
-- ② 취소 · 만났음
--
-- ⚠️⚠️ **손님도 취소할 수 있습니다.** 못 가게 된 것을 말할 길이 없으면
--   업체가 헛걸음합니다. 다만 "만났음" 은 **업체만** 적습니다 —
--   만난 사실은 업체가 압니다.
-- ⚠️ 지우지 않습니다. 잡았다가 취소한 것도 기록입니다.
-- ════════════════════════════════════════════════════════════════════
create or replace function move_appointment(p jsonb)
  returns void language plpgsql security definer
  set search_path = public as $$
declare
  v_me   uuid := auth.uid();
  v_pv   text := my_provider();
  v_role app_role := my_role();
  v_id   uuid;
  v_to   text := nullif(btrim(coalesce(p->>'to', '')), '');
  v_why  text := nullif(btrim(coalesce(p->>'why', '')), '');
  r      appointment%rowtype;
begin
  if v_me is null then raise exception '변경자를 알 수 없습니다'; end if;
  v_id := nullif(btrim(coalesce(p->>'id', '')), '')::uuid;
  if v_id is null then raise exception '어느 일정인지 적어 주세요'; end if;
  if v_to not in ('done','cancel') then
    raise exception '일정은 만났음 · 취소로만 옮깁니다';
  end if;

  select * into r from appointment where id = v_id;
  if not found then raise exception '그런 일정이 없습니다'; end if;

  -- ⚠️⚠️ **누가 무엇을 할 수 있나** — 자물쇠마다 **다른 말**로 거절합니다.
  if v_to = 'done' then
    if r.provider_id is distinct from v_pv then
      raise exception '만났음은 그 업체만 적을 수 있습니다';
    end if;
  else
    -- ⚠️⚠️⚠️ **`coalesce` 를 빼면 자물쇠가 통째로 열립니다.** SQL 은
    --   참 · 거짓 말고 **NULL** 이 있습니다. 업체가 아닌 사람은
    --   `my_provider()` 가 NULL 이라 `r.provider_id = v_pv` 가 **NULL**
    --   이고, `not (NULL or false or false)` 는 NULL 입니다 —
    --   `if NULL then` 은 **안 걸립니다.** 즉 남의 일정을 id 만 알면
    --   누구나 취소할 수 있었습니다 (검사가 잡았습니다).
    --   ⚠️ 비교가 NULL 을 낼 수 있는 자리는 **전부** coalesce 로 땅에
    --   내려놓으세요.
    if not (coalesce(r.provider_id = v_pv, false)
            or coalesce(is_my_request(r.request_id), false)
            or coalesce(v_role in ('staff','admin'), false)) then
      raise exception '이 일정을 취소할 수 없습니다';
    end if;
    -- ⚠️ 취소에는 **까닭을 받습니다** — 헛걸음한 쪽이 알아야 합니다.
    if v_why is null then raise exception '취소하시는 까닭을 적어 주세요'; end if;
  end if;

  if r.state = v_to then
    raise exception '이미 %입니다', case when v_to = 'done' then '만났음' else '취소' end;
  end if;

  update appointment set state = v_to, why = v_why, by_user = v_me, updated_at = now()
   where id = v_id;

  insert into audit_log (by_user, by_role, obj, obj_id, from_state, to_state, why, data)
  values (v_me, v_role, 'appointment', v_id::text, r.state, v_to, v_why,
          jsonb_build_object('request_id', r.request_id));
end $$;

revoke all on function set_appointment(jsonb)  from public;
revoke all on function move_appointment(jsonb) from public;
grant execute on function set_appointment(jsonb)  to authenticated;
grant execute on function move_appointment(jsonb) to authenticated;

insert into schema_version (n, name) values (34, '0034_appointment')
on conflict (n) do nothing;

commit;
