-- 0070_listing_unhide · 운영 DB 판이 69 일 때만 실행합니다
begin;
alter table listing add column if not exists hidden_from text;
comment on column listing.hidden_from is
  '가리기 직전의 state. 되돌릴 때 이 값으로 돌아갑니다 (null 이면 open).';
grant select (model, hidden_from) on listing to authenticated;
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
insert into schema_version (n, name) values (70, '0070_listing_unhide')
  on conflict (n) do nothing;
commit;
commit;
select max(n) as ver from schema_version;
