-- ════════════════════════════════════════════════════════════════════
-- 0077 — 여행 상품의 **출발일 · 출발 가능 기간** (확정 시안 ⑧)
--
-- ⚠️⚠️⚠️ **0073 은 출발일을 안 받았습니다.** 그래서 시안의 「출발 월」
--   고르개를 **아예 안 냈습니다** — 고르게 해 놓고 안 걸러 주면 눌러도
--   아무 일이 안 나는 칸이니까요(절대 규칙 5). 지시가 「담는 구조가
--   없다는 것은 기능을 빼는 까닭이 아니다 · 출발 월 필터가 실제로
--   동작하게 한다」이므로 **구조를 만듭니다.**
--
-- ⚠️⚠️ **방식이 둘입니다 — 여행 상품은 둘 다 팝니다.**
--   · `dates`  확정 출발일 여러 개 (「12/5, 12/19, 1/9 출발」)
--   · `range`  출발 가능 기간     (「12월~2월 사이 원하시는 날」)
--   · `none`   아직 안 정했습니다 ⚠️ **이것을 지우지 않습니다** —
--     0073 으로 이미 올라온 상품이 전부 이 자리이고, 억지로 날짜를
--     채우면 **지어낸 일정**이 손님 화면에 나갑니다(절대 규칙 1).
--     화면이 「출발일 미등록」으로 **갈라서** 적고, 출발 월로 좁히면
--     그 상품은 빠집니다(그 사실도 그 자리에서 말합니다).
--
-- ⚠️⚠️⚠️ **출발일은 수정본(draft) 심사를 안 거칩니다.** 0073 은 승인된
--   상품을 고치면 `draft` 로 들어가 운영자가 다시 봅니다 — 제목 · 값 ·
--   포함 조건처럼 **광고 문구에 가까운 것**이 그 자리입니다. 날짜는
--   다릅니다: 한 자리 마감되면 그날 빼야 하고, 새 일정이 잡히면 그날
--   더해야 합니다. 그것을 심사에 걸면 **여행사가 못 파는 날이 생기고**,
--   그러면 화면의 출발일이 참이 아니게 됩니다. 그래서 **따로 받습니다.**
--   ⚠️ 대신 **지난 날짜는 공개 보기가 스스로 뺍니다**(아래 함수 둘) —
--   여행사가 안 지워도 어제 날짜가 손님 화면에 남지 않습니다.
--
-- ⚠️⚠️ **보기 둘을 다시 만듭니다** — `create or replace view` 는 칸을
--   못 늘립니다(0044 가 붙여넣기 두 번째에서 멈춘 그 자리). 그리고
--   `v_trip_mine` 은 `select t.*` 이라 **다시 만들지 않으면 새 칸이
--   영영 안 나옵니다**(에러 한 줄 없이). 지우면 GRANT 도 같이 날아가니
--   **바로 다시 줍니다.**
--
-- 되돌아갔는지 보는 법:
--   select depart_kind from trip limit 1;              -- 없으면 안 올라갔습니다
--   select count(*) from pg_views where viewname = 'v_trip_date_public';
-- ════════════════════════════════════════════════════════════════════
begin;

-- ① 상품에 출발 방식 ───────────────────────────────────────────────
alter table trip add column if not exists depart_kind text not null default 'none';
alter table trip add column if not exists depart_from date;
alter table trip add column if not exists depart_to   date;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'trip_depart_kind_ck') then
    alter table trip add constraint trip_depart_kind_ck
      check (depart_kind in ('dates','range','none'));
  end if;
  -- ⚠️ `range` 면 둘 다 있어야 하고, 아니면 둘 다 없어야 합니다 —
  --   한쪽만 있으면 화면이 「12월~」처럼 **반쪽 기간**을 적게 됩니다.
  if not exists (select 1 from pg_constraint where conname = 'trip_depart_span_ck') then
    alter table trip add constraint trip_depart_span_ck
      check ((depart_kind = 'range')
             = (depart_from is not null and depart_to is not null));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'trip_depart_order_ck') then
    alter table trip add constraint trip_depart_order_ck
      check (depart_from is null or depart_to is null or depart_to >= depart_from);
  end if;
end $$;

-- ② 확정 출발일 ───────────────────────────────────────────────────
-- ⚠️ 표에는 정책도 GRANT 도 **하나도 없습니다** — 공개로 읽는 길은
--   보기 하나이고, 쓰는 길은 문 하나입니다(0066 과 같은 규칙).
create table if not exists tripdate (
  trip_id   uuid not null references trip(id) on delete cascade,
  depart_on date not null,
  primary key (trip_id, depart_on)
);
alter table tripdate enable row level security;
create index if not exists tripdate_ix on tripdate (trip_id, depart_on);

-- ③ 달 목록과 가장 가까운 출발일 ──────────────────────────────────
-- ⚠️⚠️ **달을 배열로 냅니다.** 손님 화면은 `months=cs.{2026-12}` 한 줄로
--   좁힙니다 — 그래야 거르는 일을 **서버가** 합니다(쉰 줄만 받아 화면에서
--   거르면 그 쉰 줄 밖의 상품이 영영 안 나옵니다).
-- ⚠️ 지난 달은 **안 담습니다** — 오늘이 지난 출발일로 좁혀 봐야 0건이고,
--   고르개에 지난 달이 서면 그게 눌러도 아무 일이 안 나는 칸입니다.
-- ⚠️⚠️⚠️ **보기 안의 함수는 보기 임자가 아니라 「부르는 사람」 권한으로
--   돕니다.** 처음에 이 함수가 `tripdate` 를 직접 읽게 쓰고
--   `revoke all … from public` 을 걸었더니, 여행사가 `v_trip_mine` 을
--   읽는 순간 **permission denied for function trip_months** 로 질의가
--   통째로 거절됐습니다 — 보기는 표 접근만 임자 권한으로 바꿔 줍니다.
--   ⚠️ 그래서 **자료를 인자로 받는 순수 함수**로 바꿨습니다(표를 한 줄도
--   안 읽습니다). 그러면 아무에게 EXECUTE 를 줘도 **샐 것이 없습니다** —
--   받은 날짜 배열을 달로 바꿔 줄 뿐입니다. 날짜를 모으는 일은 보기가
--   **임자 권한으로** 합니다(거기가 자물쇠입니다).
create or replace function trip_months(
  p_kind text, p_from date, p_to date, p_days date[])
returns text[] language sql immutable as $$
  select case
    when p_kind = 'range' and p_to >= kst_today() then (
      select array_agg(distinct to_char(m, 'YYYY-MM') order by to_char(m, 'YYYY-MM'))
        from generate_series(
               date_trunc('month', greatest(p_from, kst_today()))::date,
               date_trunc('month', p_to)::date,
               interval '1 month') m)
    when p_kind = 'dates' then (
      select array_agg(distinct to_char(d, 'YYYY-MM') order by to_char(d, 'YYYY-MM'))
        from unnest(coalesce(p_days, '{}'::date[])) d
       where d >= kst_today())
    else null end
$$;
-- ⚠️ 표를 안 읽는 순수 함수라 EXECUTE 를 줘도 샐 것이 없습니다.
--   **보기가 부르므로 반드시 줘야 합니다**(안 주면 보기가 통째로 거절).
grant execute on function trip_months(text, date, date, date[])
  to anon, authenticated;

-- ⚠️ 위와 같은 까닭으로 **자료를 인자로** 받습니다(표를 안 읽습니다).
create or replace function trip_next_depart(
  p_kind text, p_from date, p_to date, p_days date[])
returns date language sql immutable as $$
  select case
    when p_kind = 'range' and p_to >= kst_today()
      then greatest(p_from, kst_today())
    when p_kind = 'dates' then (
      select min(d) from unnest(coalesce(p_days, '{}'::date[])) d
       where d >= kst_today())
  end
$$;
grant execute on function trip_next_depart(text, date, date, date[])
  to anon, authenticated;

-- ④ 여행사가 출발일을 정하는 문 ───────────────────────────────────
-- ⚠️⚠️ **늘어놓은 것을 통째로 받습니다**(0069 의 `order_listing_photo`
--   와 같은 꼴) — 한 날짜씩 더하고 빼게 두면 두 창에서 같이 고칠 때
--   번호가 어긋납니다. 보내신 것이 그 상품의 **전부**입니다.
-- ⚠️ 운영자가 가린 상품(`hidden`)은 여행사가 못 건드립니다.
create or replace function set_trip_depart(p jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_pv   text := my_provider();
  v_id   uuid := nullif(p->>'trip','')::uuid;
  v_kind text := coalesce(nullif(btrim(p->>'kind'),''), 'none');
  v_from date := nullif(p->>'from','')::date;
  v_to   date := nullif(p->>'to',''  )::date;
  v_arr  jsonb := coalesce(p->'dates', '[]'::jsonb);
  v_st   text;
  v_n    int;
begin
  if v_pv is null then raise exception '업체 담당자만 쓸 수 있습니다'; end if;
  if v_id is null then raise exception '어느 상품인지 알 수 없습니다'; end if;

  select state into v_st from trip
   where id = v_id and provider_id = v_pv for update;
  if v_st is null then raise exception '그 상품을 찾을 수 없습니다'; end if;
  if v_st = 'hidden' then
    raise exception '가려진 상품은 고칠 수 없습니다 — 고객센터로 문의해 주세요';
  end if;

  if v_kind not in ('dates','range','none') then
    raise exception '출발 방식은 확정 출발일 · 출발 가능 기간 · 미정 셋 가운데 하나입니다';
  end if;

  if v_kind = 'range' then
    if v_from is null or v_to is null then
      raise exception '출발 가능 기간은 시작일과 마지막 날을 함께 적어 주세요';
    end if;
    if v_to < v_from then
      raise exception '마지막 날이 시작일보다 앞설 수 없습니다';
    end if;
    if v_to < kst_today() then
      raise exception '이미 지난 기간입니다 — 오늘 이후로 적어 주세요';
    end if;
    if v_to > kst_today() + 730 then
      raise exception '출발 가능 기간은 2년 안으로 적어 주세요';
    end if;
  else
    v_from := null; v_to := null;
  end if;

  -- ⚠️ 확정 출발일은 **그 상품의 전부**로 갈아 끼웁니다
  delete from tripdate where trip_id = v_id;
  if v_kind = 'dates' then
    if jsonb_typeof(v_arr) <> 'array' then
      raise exception '출발일은 목록으로 보내 주세요';
    end if;
    insert into tripdate (trip_id, depart_on)
    select v_id, (x)::date
      from jsonb_array_elements_text(v_arr) t(x)
     where btrim(x) <> ''
    on conflict do nothing;
    select count(*) into v_n from tripdate where trip_id = v_id;
    if v_n = 0 then
      raise exception '출발일을 하나 이상 적어 주세요';
    end if;
    if v_n > 60 then
      raise exception '출발일은 60개까지 적을 수 있습니다';
    end if;
    -- ⚠️⚠️ **지난 날짜는 아예 안 받습니다** — 받아 두면 여행사 화면에는
    --   남고 손님 화면에서는 빠져 **둘이 다른 말**을 합니다.
    if exists (select 1 from tripdate
                where trip_id = v_id and depart_on < kst_today()) then
      raise exception '지난 날짜는 출발일로 넣을 수 없습니다';
    end if;
    if exists (select 1 from tripdate
                where trip_id = v_id and depart_on > kst_today() + 730) then
      raise exception '출발일은 2년 안으로 적어 주세요';
    end if;
  end if;

  update trip
     set depart_kind = v_kind, depart_from = v_from, depart_to = v_to,
         updated_at = now()
   where id = v_id;

  -- ⚠️ 기록에 **날짜를 안 담습니다** — 무엇을 바꿨는지는 상품을 보면
  --   됩니다. 기록은 오래 남고 보는 사람이 넓습니다.
  insert into audit_log (by_user, by_role, obj, obj_id, to_state, why)
  values (auth.uid(), my_role(), 'trip', v_id::text,
          'depart-' || v_kind, null);

  return jsonb_build_object('ok', true, 'kind', v_kind,
                            'n', coalesce(v_n, 0));
end $$;
revoke all on function set_trip_depart(jsonb) from public;
grant execute on function set_trip_depart(jsonb) to authenticated;

-- ⑤ 공개로 나가는 출발일 ──────────────────────────────────────────
-- ⚠️ 승인된 상품의 **오늘 이후** 날짜만 냅니다 — 여행사가 안 지워도
--   어제 날짜가 손님 화면에 남지 않습니다.
drop view if exists v_trip_date_public;
create view v_trip_date_public as
  select d.trip_id, d.depart_on
    from tripdate d
    join trip t      on t.id = d.trip_id
    join provider pv on pv.id = t.provider_id
   where d.depart_on >= kst_today()
     and t.state = 'approved' and pv.state = 'approved' and pv.is_test = false
   order by d.trip_id, d.depart_on;
grant select on v_trip_date_public to anon, authenticated;

-- 여행사가 제 작업실에서 보는 것 (상태와 상관없이 · 지난 날짜도)
drop view if exists v_trip_date_mine;
create view v_trip_date_mine as
  select d.trip_id, d.depart_on
    from tripdate d
    join trip t on t.id = d.trip_id
   where t.provider_id = my_provider()
   order by d.trip_id, d.depart_on;
grant select on v_trip_date_mine to authenticated;

-- ⑥ 보기 둘을 다시 만듭니다 ───────────────────────────────────────
-- ⚠️⚠️⚠️ `create or replace view` 는 **칸을 못 늘립니다.** 그리고
--   `v_trip_mine` 은 `select t.*` 이라 **다시 만들지 않으면 새 칸 셋이
--   영영 안 나옵니다**(에러 한 줄 없이 — 여행사 화면이 출발일을 못
--   읽습니다). 지우면 GRANT 도 같이 날아가므로 **바로 다시 줍니다.**
drop view if exists v_trip_open;
create view v_trip_open as
  select t.id, t.scope, t.dest, t.title, t.body, t.nights, t.days,
         t.price_from, t.price_note, t.incl, t.excl,
         t.created_at, t.updated_at,
         t.depart_kind, t.depart_from, t.depart_to,
         -- ⚠️ 못 찾으면 **빈 배열**입니다 — null 로 두면 화면이
         --   `months.length` 에서 터집니다.
         -- ⚠️⚠️ 날짜를 모으는 일은 **보기가 임자 권한으로** 합니다 —
         --   그래서 `tripdate` 를 읽을 권한이 없는 손님도 달을 봅니다.
         coalesce(trip_months(t.depart_kind, t.depart_from, t.depart_to, dd.days),
                  '{}'::text[]) as months,
         trip_next_depart(t.depart_kind, t.depart_from, t.depart_to, dd.days)
           as depart_next,
         pv.id   as provider_id,
         pv.name as provider_name,
         (select count(*) from tripphoto ph
           where ph.trip_id = t.id and ph.live) as photo_n,
         (select ph.path from tripphoto ph
           where ph.trip_id = t.id and ph.live
           order by ph.ord, ph.created_at, ph.id limit 1) as thumb
    from trip t
    join provider pv on pv.id = t.provider_id
    left join lateral (
      select array_agg(d.depart_on order by d.depart_on) as days
        from tripdate d where d.trip_id = t.id) dd on true
   where t.state = 'approved'
     and pv.state = 'approved'
     and pv.is_test = false;
grant select on v_trip_open to anon, authenticated;

drop view if exists v_trip_mine;
create view v_trip_mine as
  select t.*,
         coalesce(trip_months(t.depart_kind, t.depart_from, t.depart_to, dd.days),
                  '{}'::text[]) as months,
         trip_next_depart(t.depart_kind, t.depart_from, t.depart_to, dd.days)
           as depart_next,
         (select count(*) from tripdate d where d.trip_id = t.id) as date_n,
         (select count(*) from tripphoto ph
           where ph.trip_id = t.id and ph.live) as photo_n,
         (select count(*) from tripphoto ph
           where ph.trip_id = t.id and not ph.live) as photo_draft_n,
         (select count(*) from tripphoto ph
           where ph.trip_id = t.id and ph.drop_pending) as photo_drop_n
    from trip t
    left join lateral (
      select array_agg(d.depart_on order by d.depart_on) as days
        from tripdate d where d.trip_id = t.id) dd on true
   where t.provider_id = my_provider();
grant select on v_trip_mine to authenticated;

insert into schema_version (n, name) values (77, '0077_trip_depart')
on conflict (n) do nothing;

commit;
