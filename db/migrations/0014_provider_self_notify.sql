-- ════════════════════════════════════════════════════════════════════
-- 0014 — 업체가 스스로 고치는 길 + 고객 진행 안내 받기
--
-- 2026-10-22 오픈 전 전수검사 **P2 ⑳ ⑱** (docs/PRELAUNCH_AUDIT-2026-10-22.md §5)
--
--   ⑳ 업체가 **스스로 등록 · 수정**하는 화면
--      → 지금은 직원이 /admin 9번 칸에서 적습니다. 업체가 늘면
--        소개 한 줄을 고치는 일에도 직원을 거쳐야 합니다.
--   ⑱ 고객에게 **상태 변경 알림**
--      → 접수번호를 화면에서 한 번 보고 끝입니다. 배정 · 견적 도착을
--        알 길이 없습니다.
--
-- 두 문                                누가
--   save_provider_self()               업체 **자기 줄만**
--   save_provider_contact()            직원 · 관리자 + **업체 자기 줄** (넓힙니다)
-- 칸 둘
--   request.notify_ok / notify_at      진행 안내를 받으시겠다는 **선택** 동의
--
-- ⚠️⚠️ **돌린 파일(0001 ~ 0013)을 고치지 않았습니다.** 0013 의 함수는
--   `create or replace` 로 갈아 끼웁니다 (같은 인자 · 같은 이름).
-- ⚠️ 두 번 돌려도 안전합니다 (`if not exists` · `create or replace`).
-- ════════════════════════════════════════════════════════════════════

begin;

-- ════════════════════════════════════════════════════════════════════
-- ⑳-1 업체가 스스로 고치는 길 — ⚠️⚠️ **표를 닫고 문으로만** 받습니다
--
-- 0001 이 `grant update (name, intro, regions, gu, industries, subs,
-- since, consult_hours) on provider to authenticated` 로 **칸 단위
-- 쓰기**를 열어 두었습니다. 그런데 —
--
--   ① **감사 기록이 안 남습니다.** PostgREST 로 바로 PATCH 하면
--      누가 언제 무엇을 고쳤는지가 어디에도 없습니다 (§8).
--   ② **`name` 과 `subs` 까지 열려 있었습니다.** 상호는 제휴 계약의
--      이름이고, `subs`(하는 일)는 **어느 분야 화면에 나오는가**를
--      정합니다 — 업체가 스스로 넓히면 철거만 하는 곳이 세무 화면에
--      앉습니다. 그건 `approve_provider()` 가 보는 일입니다.
--   ③ 그 권한을 **쓰는 코드가 한 줄도 없었습니다** — `api/_db.js` 에
--      update 를 보내는 함수 자체가 없습니다 (select · insert · rpc 뿐).
--
-- 그래서 권한을 걷고 **문 하나**로 모읍니다. 0003 이 돈 쪽에,
-- 0004 가 상태 쪽에 한 것과 같습니다 — **기록 없이 지나갈 길이
-- 없습니다.**
-- ════════════════════════════════════════════════════════════════════
revoke update on provider from authenticated;

-- ⚠️⚠️ **업체가 못 건드리는 것** — 상호 · 하는 일 · 확인 배지 · 공개 ·
--   배정 가능 · 주소(id). 앞의 둘은 여기서, 뒤의 넷은 애초에 이
--   함수가 안 씁니다 (+ `provider_guard()` 트리거가 한 번 더).
create or replace function save_provider_self(
  p_data jsonb default '{}'::jsonb,   -- intro · regions · gu · industries · since · consultHours
  p_why  text  default null
) returns text
  language plpgsql security definer set search_path = public as $$
declare
  v_me   uuid     := auth.uid();
  v_role app_role := my_role();
  v_pv   text     := my_provider();
begin
  if v_me is null then raise exception '변경자를 알 수 없습니다'; end if;
  -- ⚠️⚠️ 역할을 요청에서 읽지 않습니다 — 토큰으로 `account` 를 보고
  --   거기 적힌 `provider_id` 만 고칩니다. 남의 업체는 애초에 못 집습니다.
  if v_role <> 'provider' or v_pv is null then
    raise exception '업체 계정으로 로그인하셔야 합니다';
  end if;
  if not exists (select 1 from provider where id = v_pv) then
    raise exception '연결된 업체를 찾을 수 없습니다';
  end if;

  update provider set
    intro = nullif(btrim(coalesce(p_data->>'intro','')), ''),
    regions = coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(p_data->'regions','[]'::jsonb)) x), '{}'),
    gu = coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(p_data->'gu','[]'::jsonb)) x), '{}'),
    industries = coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(p_data->'industries','[]'::jsonb)) x), '{}'),
    since = nullif(p_data->>'since','')::int,
    consult_hours = nullif(btrim(coalesce(p_data->>'consultHours','')), '')
  where id = v_pv;

  -- ⚠️ 같은 트랜잭션입니다 — 기록이 실패하면 수정도 안 됩니다 (§8).
  insert into audit_log (by_user, by_role, obj, obj_id, to_state, why, data)
  values (v_me, v_role, 'provider', v_pv, 'self-updated', p_why, p_data);

  return v_pv;
end $$;

revoke all on function save_provider_self(jsonb, text) from public;
grant execute on function save_provider_self(jsonb, text) to authenticated;


-- ════════════════════════════════════════════════════════════════════
-- ⑳-2 담당자도 업체가 적을 수 있게 — ⚠️ **자기 줄만**
--
-- 0013 이 직원 · 관리자만으로 열어 두었습니다. 그런데 담당자 이름 ·
-- 직통은 **업체가 제일 잘 압니다** (사람이 바뀌면 그 자리에서 고칠
-- 수 있어야 합니다). 읽기는 0013 의 `provider_contact_self` 로 이미
-- 열려 있어서, 쓰기만 넓힙니다.
--
-- ⚠️⚠️ `p_provider` 를 **그대로 믿지 않습니다** — 업체 계정이면
--   `my_provider()` 와 같은지 보고 다르면 거절합니다. 안 보면 업체가
--   남의 업체 담당자를 덮어쓸 수 있습니다.
-- ⚠️⚠️ 이 문은 **`FN_SAY` 에 없습니다** (api/deal.js) — 알림에 담당자
--   이름 · 번호가 실리면 그 순간 새 수탁 범위입니다 (제26조).
-- ════════════════════════════════════════════════════════════════════
create or replace function save_provider_contact(
  p_provider text,
  p_data     jsonb default '{}'::jsonb,   -- name · tel · email · memo
  p_why      text  default null
) returns text
  language plpgsql security definer set search_path = public as $$
declare
  v_me   uuid     := auth.uid();
  v_role app_role := my_role();
  v_name  text := nullif(btrim(coalesce(p_data->>'name','')), '');
  v_tel   text := nullif(btrim(coalesce(p_data->>'tel','')), '');
  v_mail  text := nullif(btrim(coalesce(p_data->>'email','')), '');
  v_memo  text := nullif(btrim(coalesce(p_data->>'memo','')), '');
  v_keys  text[] := '{}';
begin
  if v_me is null then raise exception '변경자를 알 수 없습니다'; end if;
  if v_role = 'provider' then
    -- ⚠️ 업체는 **자기 줄만** — 요청이 보낸 id 를 믿지 않습니다
    if my_provider() is null or p_provider is distinct from my_provider() then
      raise exception '내 업체의 담당자만 적을 수 있습니다';
    end if;
  elsif v_role not in ('staff','admin') then
    raise exception '업체 담당자 등록은 업체 · 직원 · 관리자만 할 수 있습니다';
  end if;
  if not exists (select 1 from provider where id = p_provider) then
    raise exception '없는 업체입니다 — %', coalesce(p_provider,'(없음)');
  end if;
  -- ⚠️ 넷이 다 비면 **줄을 만들지 않습니다** (빈 줄을 안 남깁니다 ·
  --   절대 규칙 2). 지우실 때는 넷을 비워서 보내시면 됩니다.
  if v_name is null and v_tel is null and v_mail is null and v_memo is null then
    delete from provider_contact where provider_id = p_provider;
    insert into audit_log (by_user, by_role, obj, obj_id, to_state, why)
    values (v_me, v_role, 'provider_contact', p_provider, 'cleared', p_why);
    return p_provider;
  end if;
  if v_mail is not null and position('@' in v_mail) < 2 then
    raise exception '메일 주소가 이상합니다';
  end if;

  insert into provider_contact (provider_id, name, tel, email, memo, updated_by)
  values (p_provider, v_name, v_tel, v_mail, v_memo, v_me)
  on conflict (provider_id) do update set
    name = excluded.name, tel = excluded.tel, email = excluded.email,
    memo = excluded.memo, updated_by = excluded.updated_by,
    updated_at = now();

  -- ⚠️⚠️ **감사 기록에 연락처를 싣지 않습니다** (0013 과 같은 까닭).
  if v_name is not null then v_keys := array_append(v_keys, 'name');  end if;
  if v_tel  is not null then v_keys := array_append(v_keys, 'tel');   end if;
  if v_mail is not null then v_keys := array_append(v_keys, 'email'); end if;
  if v_memo is not null then v_keys := array_append(v_keys, 'memo');  end if;
  insert into audit_log (by_user, by_role, obj, obj_id, to_state, why, data)
  values (v_me, v_role, 'provider_contact', p_provider, 'saved', p_why,
          jsonb_build_object('fields', to_jsonb(v_keys)));

  return p_provider;
end $$;

revoke all on function save_provider_contact(text, jsonb, text) from public;
grant execute on function save_provider_contact(text, jsonb, text) to authenticated;


-- ════════════════════════════════════════════════════════════════════
-- ⑱ 고객 진행 안내 — ⚠️⚠️ **선택**이고 기본은 꺼짐입니다
--
-- 배정 · 견적 도착은 **거래 정보**라 정보통신망법 제50조의 광고성
-- 정보와 다른 건입니다 (접수 완료 안내를 동의 없이 보내는 것과 같은
-- 결). 그래도 **받으시겠다고 하신 분에게만** 보냅니다 —
--
--   ① 광고가 섞이기 쉬운 자리입니다. 한 줄만 권유를 넣으면 그때부터
--      광고이고 사전동의가 먼저입니다 — 동의를 먼저 받아 두면 그
--      선을 넘을 일이 줄어듭니다.
--   ② 끄는 길이 없는 채로 보내면 받기 싫은 분이 막을 수가 없습니다
--      (로그인 없이 들어오는 접수라 수신거부 토큰도 없습니다).
--
-- ⚠️⚠️ **boolean 하나로 두지 않습니다.** `notify_at`(언제 받았나)이
--   같이 있어야 분쟁에서 "받았다" 를 댈 수 있습니다 — `agree_at` ·
--   `agree3rd_at` 과 같은 규칙입니다.
-- ⚠️ 기본값 **false** 입니다 (fail-closed). 안 고르신 것을 "받겠다"
--   로 읽으면 그게 동의 없이 보내는 것입니다.
-- ════════════════════════════════════════════════════════════════════
alter table request add column if not exists notify_ok boolean not null default false;
alter table request add column if not exists notify_at timestamptz;

-- ⚠️⚠️ **동의했다면 시각이 있어야 합니다.** 화면 버그로 true 만 들어오면
--   "언제 받았나" 를 못 대고, 그건 받지 않은 것과 같습니다.
alter table request drop constraint if exists request_notify_at_ok;
alter table request add constraint request_notify_at_ok
  check (notify_ok = false or notify_at is not null);

-- ⚠️ 쓰기 권한을 주지 않습니다 — 접수는 service key 가 넣고(RLS·GRANT
--   를 지나갑니다), 끄는 것은 **메일의 안내대로 회신**입니다. 화면에
--   끄는 단추를 두려면 문을 하나 더 내야 하고(로그인이 필요합니다),
--   지금은 로그인한 고객이 0명이라 그게 작동하지 않는 버튼입니다.

insert into schema_version (n, name) values (14, '0014_provider_self_notify')
  on conflict (n) do nothing;

commit;
