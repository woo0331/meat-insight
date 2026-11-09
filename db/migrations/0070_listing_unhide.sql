-- ════════════════════════════════════════════════════════════════════
-- 0070 — 가린 매물을 **되돌리는 길** (중고장터 개편 지시서 §7)
--
-- ⚠️⚠️⚠️ **0056 의 `move_listing` 은 한쪽으로만 갑니다.**
--   `if v_to <> 'hidden' then raise exception '옮길 수 없는 상태입니다'`
--   — 즉 운영자가 한 번 가리면 **되돌릴 길이 아무에게도 없었습니다.**
--   올린 분의 문(`edit_listing` · `close_listing`)은 전부
--   `state in ('open','reserved')` 를 요구하므로 가려진 매물에는 안
--   듣고, 사장님이 SQL 편집기에서 직접 `update` 를 치셔야 했습니다.
--   0043 이 잇는 문만 내고 끊는 문을 안 낸 자리 · 0025 가 붙이는 문만
--   내고 떼는 문을 안 낸 자리(0054 가 고쳤습니다)와 **같은 꼴**입니다.
--   ⚠️ `check-doors` 는 이것을 **못 잡습니다** — `move_listing` 을
--   부르는 화면은 있습니다(신고 처리). 없는 것은 **되돌리는 방향**이고,
--   **없는 것은 셀 수가 없습니다.**
--
-- ⚠️⚠️ **「판매중」으로 되돌리지 않습니다 — 가리기 전 상태로 되돌립니다.**
--   팔린(`done`) 매물을 가렸다가 되돌리면서 `open` 으로 두면 **이미
--   팔린 물건이 다시 살 수 있는 것처럼** 목록에 섭니다 (절대 규칙 1).
--   그래서 가릴 때 그 전 상태를 `hidden_from` 에 적어 둡니다.
--   ⚠️ 0070 **전에** 가려진 줄은 그 칸이 null 이라 `open` 으로 돌아갑니다
--   — 지어낼 수 없는 값이고, 운영 DB 에는 그런 줄이 0건입니다
--   (`listing` 표가 아직 운영에 없습니다).
--
-- ⚠️⚠️ **같은 상태로 옮기는 것은 거절합니다** — 조용히 성공하면 화면이
--   "바꿨습니다" 를 적는데 아무 일도 안 일어났고, 감사 기록에는
--   "가렸다" 가 남습니다 (0054 에서 세운 규칙).
--
-- ⚠️ 되돌아갔는지 보는 법 (0056 을 다시 붙여 넣으면 이 문이 내려갑니다):
--     select pg_get_functiondef('move_listing(jsonb)'::regprocedure)
--       like '%hidden_from%' as ok_0070;
--   false 면 0070 을 다시 붙여 넣으세요.
--   체인: move_listing(0056→0070)
-- ════════════════════════════════════════════════════════════════════

begin;

-- ① 가리기 전 상태를 적어 두는 칸
--    ⚠️ 값 묶음을 check 로 박지 않습니다 — `listing.state` 의 check 가
--      늘어나는 날 두 곳이 어긋나고, 그때 되돌리기가 조용히 거절됩니다.
alter table listing add column if not exists hidden_from text;

comment on column listing.hidden_from is
  '가리기 직전의 state. 되돌릴 때 이 값으로 돌아갑니다 (null 이면 open).';

-- ② 칸 단위 GRANT — ⚠️⚠️⚠️ **0069 가 `model` 을 빠뜨렸습니다.**
--   0056 은 `listing` 에 **칸 단위**로 select 를 줍니다(연락처 · 동의
--   시각을 빼려고 그렇게 했습니다). 칸 단위 GRANT 는 **나중에 생긴
--   칸을 저절로 덮지 않습니다** — 0068 은 `brand` 를 따로 줬는데
--   0069 는 `model` 을 더해 놓고 GRANT 를 안 줬습니다.
--   ⚠️⚠️ 그래서 `js/mylisting.js` 의
--     listing?select=id,title,...,brand,model,hidden_why,created_at
--   가 **질의째 거절**되고(0줄이 아닙니다), `/my` 의 「내 판매글」
--   상자가 **통째로 안 뜹니다.** 올리신 분이 제 매물을 고칠 수도 ·
--   팔렸다고 표시할 수도 · 사진을 붙일 수도 없습니다.
--   ⚠️ 검사가 못 잡은 까닭: `test-desk` 의 흉내 서버는 **칸 GRANT 를
--   흉내 내지 않습니다**(정해진 JSON 을 돌려줍니다). 그래서
--   `tools/sql/listing.js` 가 **그 질의를 글자 그대로** 눌러 봅니다.
--   ⚠️ **칸을 더하는 날 GRANT 도 같이** — 0053 의 `memo` · 0013 의
--   연락처와 같은 자리이고, 이번은 거꾸로(안 줘서 막힌 쪽)입니다.
grant select (model, hidden_from) on listing to authenticated;

-- ③ 문 — 가리기 · 되돌리기 (운영자만)
create or replace function move_listing(p jsonb)
returns text
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_id  uuid := nullif(btrim(coalesce(p->>'id','')), '')::uuid;
  v_to  text := nullif(btrim(coalesce(p->>'state','')), '');
  v_why text := nullif(btrim(coalesce(p->>'why','')), '');
  v_st  text;
  v_fr  text;
  v_new text;
begin
  if v_uid is null then raise exception '로그인이 필요합니다'; end if;
  if v_id is null then raise exception '어느 매물인지 알 수 없습니다'; end if;
  -- ⚠️⚠️ 0070 — 되돌리는 길이 생겼습니다. `open` 은 "가리기 전으로" 라는
  --   뜻이고, 어느 상태로 돌아가는지는 `hidden_from` 이 정합니다.
  if v_to not in ('hidden','open') then
    raise exception '옮길 수 없는 상태입니다';
  end if;
  if not coalesce(my_role() in ('staff','admin'), false) then
    raise exception '가리는 것은 운영자만 할 수 있습니다';
  end if;

  select state, hidden_from into v_st, v_fr
    from listing where id = v_id for update;
  if v_st is null then raise exception '그런 매물이 없습니다'; end if;

  if v_to = 'hidden' then
    -- ⚠️⚠️ 까닭을 **반드시** 받습니다 — 까닭 없이 가릴 수 있으면 불평이
    --   올 때마다 지워 주는 자리가 됩니다
    if v_why is null or char_length(v_why) < 5 then
      raise exception '가리는 까닭을 다섯 글자 이상 적어 주세요';
    end if;
    if v_st = 'hidden' then raise exception '이미 가려진 매물입니다'; end if;

    update listing set state = 'hidden', hidden_why = v_why,
                       hidden_by = v_uid, hidden_at = now(),
                       hidden_from = v_st, updated_at = now()
     where id = v_id;
    v_new := 'hidden';
  else
    if v_st <> 'hidden' then raise exception '가려진 매물이 아닙니다'; end if;
    -- ⚠️ 되돌릴 때는 까닭을 안 받습니다 — 받으면 되돌리기가 가리기보다
    --   어려워지고, 그러면 잘못 가린 것이 그대로 남습니다.
    v_new := coalesce(nullif(btrim(coalesce(v_fr,'')), ''), 'open');
    -- ⚠️⚠️ **가리기 전 상태가 다시 `hidden` 일 수는 없습니다** — 그랬으면
    --   위에서 '이미 가려진 매물입니다' 로 막혔습니다. 그래도 한 번 더
    --   봅니다 (0070 전에 손으로 적힌 줄이 있을 수 있습니다).
    if v_new = 'hidden' then v_new := 'open'; end if;

    update listing set state = v_new, hidden_why = null, hidden_by = null,
                       hidden_at = null, hidden_from = null, updated_at = now()
     where id = v_id;
  end if;

  -- ⚠️ 감사 기록에 **본문을 넣지 않습니다** (오래 남고 보는 사람도 넓습니다)
  insert into audit_log (by_user, by_role, obj, obj_id, from_state, to_state, data)
  values (v_uid, my_role(), 'listing', v_id::text, v_st, v_new,
          jsonb_build_object('why_len', coalesce(char_length(v_why), 0)));
  return v_new;
end $$;

revoke all on function move_listing(jsonb) from public;
grant execute on function move_listing(jsonb) to authenticated;

-- ⚠️ 돌린 판을 적어 둡니다 — `db/verify.sql` 과 `tools/sql/base.js` 가
--   **파일 수와 이 표의 줄 수가 같은지**를 봅니다 (안 적으면 그 줄이
--   빨개지고, 운영에서는 "무엇까지 올라갔나" 를 셀 수가 없습니다).
insert into schema_version (n, name) values (70, '0070_listing_unhide')
  on conflict (n) do nothing;

commit;
