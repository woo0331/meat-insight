-- ════════════════════════════════════════════════════════════════════
-- 0078 — 공고 **북마크**(저장) 와 내 저장 목록 (확정 시안 ⑨)
--
-- ⚠️⚠️⚠️ **0072 까지 담는 표가 없어서 북마크를 안 그렸습니다** — 그리면
--   눌러도 아무 일이 안 나는 단추니까요(절대 규칙 5). 지시가 「담는
--   구조가 없다는 것은 기능을 빼는 까닭이 아니다 · 북마크 저장 · 해제 ·
--   내 저장 목록과 사용자별 권한을 구현한다」이므로 **표를 만듭니다.**
--
-- ⚠️⚠️ **0069 의 `listingfav` 를 그대로 베낍니다** — 짜임새가 같습니다
--   (내가 담고 · 내가 빼고 · 내 것만 봅니다). 새로 설계하면 그 자리마다
--   다시 틀립니다(0056 이 0046 을 베낀 그 까닭).
--
-- ⚠️⚠️⚠️ **저장 수를 공개하지 않습니다.** 셀 수야 있지만 「인기 공고」로
--   읽히고 우리가 검증할 길이 없으며, 누가 무엇을 담았는지는 **행동
--   기록**이라 올린 분에게도 · **운영자에게도** 안 냅니다 (0059 의
--   `cqview` · 0069 의 찜과 같은 결). 그래서 `v_job_open` 에 `fav_n`
--   칸이 **아예 없습니다.**
--
-- ⚠️⚠️ **마감된 공고도 저장 목록에 남습니다** — `v_job_open` 을 그대로
--   썼으면 마감되는 순간 담아 둔 공고가 **조용히 사라집니다**
--   ("마감되었습니다" 를 보여 드리는 것이 맞습니다 · 0069 의 그 자리).
--   그래서 이 보기는 **표에서 직접** 셉니다.
--
-- 되돌아갔는지 보는 법:
--   select count(*) from pg_tables where tablename = 'jobfav';
--   select count(*) from pg_views  where viewname  = 'v_job_fav';
-- ════════════════════════════════════════════════════════════════════
begin;

create table if not exists jobfav (
  by_user    uuid not null references auth.users(id) on delete cascade,
  post_id    uuid not null references jobpost(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (by_user, post_id)
);
create index if not exists jobfav_mine_idx on jobfav (by_user, created_at desc);

alter table jobfav enable row level security;

-- ⚠️⚠️ **운영자 정책도 두지 않습니다** — 누가 무엇을 담았는지는 행동
--   기록이고 운영자가 그것을 읽을 까닭이 없습니다.
drop policy if exists jobfav_mine on jobfav;
create policy jobfav_mine on jobfav
  for select using (by_user = auth.uid());

-- ⚠️⚠️ **쓰기 GRANT 를 주지 않습니다** — 들어오는 길은 문 하나뿐입니다.
grant select on jobfav to authenticated;

-- ── 담고 빼는 문 ─────────────────────────────────────────────────
-- ⚠️ 켜고 끄는 것을 **문 하나**로 둡니다 — 둘로 나누면 화면이 지금
--   상태를 먼저 알아야 하고, 그 사이에 다른 창에서 바뀌면 어긋납니다.
create or replace function fav_jobpost(p jsonb default '{}'::jsonb)
  returns boolean
  language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
  v_j  uuid := nullif(btrim(coalesce(p->>'id','')), '')::uuid;
  v_on boolean := coalesce((p->>'on')::boolean, true);
  v_st text;
begin
  if v_me is null then raise exception '로그인이 필요합니다'; end if;
  if v_j is null then raise exception '어느 공고인지 알 수 없습니다'; end if;

  if v_on then
    select state into v_st from jobpost where id = v_j;
    if v_st is null then raise exception '그런 공고가 없습니다'; end if;
    -- ⚠️ 내려간 · 가려진 공고는 담을 수 없습니다 — 담아 두면 저장
    --   목록에 **열 수 없는 줄**이 쌓입니다.
    if v_st not in ('open','closed') then
      raise exception '지금은 저장할 수 없는 공고입니다';
    end if;
    if (select count(*) from jobfav where by_user = v_me) >= 200 then
      raise exception '저장은 200개까지입니다. 먼저 정리해 주세요';
    end if;
    insert into jobfav (by_user, post_id) values (v_me, v_j)
      on conflict (by_user, post_id) do nothing;
    return true;
  end if;

  delete from jobfav where by_user = v_me and post_id = v_j;
  return false;
end $$;
revoke all on function fav_jobpost(jsonb) from public;
grant execute on function fav_jobpost(jsonb) to authenticated;

-- ── 내 저장 목록 (`/my`) ─────────────────────────────────────────
-- ⚠️⚠️ **`v_job_open` 을 그대로 쓸 수 없습니다** (위 머리말) — 마감된
--   공고가 **조용히 사라집니다.** 표에서 직접 세고 `state` 를 그대로
--   냅니다. ⚠️ `contact` · `by_user` 는 **안 담습니다**(0048 의 선).
drop view if exists v_job_fav;
create view v_job_fav as
  select f.post_id as id, f.created_at as fav_at,
         j.kind, j.sub, j.region, j.title,
         j.pay, j.terms, j.close_at, j.state,
         j.role, j.emp_type, j.pay_type, j.pay_min,
         j.created_at,
         -- ⚠️ `as_pro` 는 **칸이 아닙니다** — 문이 `provider_id` 를 채웁니다.
         --   그리고 **읽을 때 다시** 상태를 봅니다(정지되면 그 순간 상호가
         --   빠집니다 · 0048 에서 세운 규칙).
         case when pv.id is not null and pv.state = 'approved'
                   and pv.is_test = false
              then pv.name end as pro_name
    from jobfav f
    join jobpost j on j.id = f.post_id
    left join provider pv on pv.id = j.provider_id
   where f.by_user = auth.uid()
     and j.state in ('open','closed')
   order by f.created_at desc;
grant select on v_job_fav to authenticated;

insert into schema_version (n, name) values (78, '0078_job_fav')
on conflict (n) do nothing;

commit;
