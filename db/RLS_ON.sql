-- ════════════════════════════════════════════════════════════════════
--  고리 — RLS 켜기 (START.md 2단계)
--
--  이 파일 하나만 통째로 복사해서 Supabase → SQL Editor 에 붙여넣고
--  Run 하면 끝납니다. 주석을 풀 필요도, 순서를 맞출 필요도 없습니다.
--
--  왜 필요한가
--    RLS 를 켜지 않으면 브라우저에 공개된 anon 키만으로 누구나 남의
--    요청·업체 정보를 UPDATE·DELETE 할 수 있습니다. 지금 그 상태입니다.
--
--  안전장치
--    · 추가 전용입니다. DROP TABLE / DELETE / TRUNCATE 가 한 줄도 없습니다.
--    · 없는 표는 조용히 건너뜁니다 — phase2~7 을 아직 안 돌렸어도 됩니다.
--    · 여러 번 실행해도 같은 결과입니다 (정책을 지웠다 다시 만듭니다).
--    · 읽기와 등록은 계속 열려 있습니다. 손님이 요청을 올리는 것도,
--      목록을 보는 것도 그대로 됩니다. 막는 것은 "남의 것 수정·삭제"입니다.
--
--  관리 화면(suppliers.html / jobs.html / purchase_request.html)은
--  계속 씁니다 — admins 표에 등록된 계정으로 로그인해서 들어가면
--  수정·삭제가 됩니다. 로그인 없이 열면 그때 막힙니다.
--
--  맨 아래에 확인표가 나옵니다. 19개 표가 전부 ✅ 면 성공입니다.
-- ════════════════════════════════════════════════════════════════════


-- ────────────────────────────────────────────────────────────
-- 0. 관리자 판별 (phase4 와 동일 — 이 파일만 실행해도 되게 다시 만듭니다)
-- ────────────────────────────────────────────────────────────
create table if not exists public.admins (
  email      text primary key,
  name       text,
  memo       text,
  created_at timestamptz default now()
);
alter table public.admins enable row level security;
drop policy if exists admins_self on public.admins;
create policy admins_self on public.admins
  for select using (auth.email() = email);

create or replace function public.is_gori_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (select 1 from public.admins a where a.email = auth.email());
$$;

-- 🔴 관리자를 아직 등록하지 않았다면 아래 한 줄의 주석을 풀고 이메일을 넣으세요.
--    등록하지 않으면 삭제할 수 있는 사람이 아무도 없습니다.
-- insert into public.admins (email, name) values ('본인@이메일.com','운영자')
--   on conflict (email) do nothing;


-- ────────────────────────────────────────────────────────────
-- 1. 요청 · 업체 · 구인 — 가장 급한 세 표
--    (phase4 5번 블록과 같은 내용입니다. 주석을 풀 필요 없이 바로 실행됩니다)
--
--    읽기·등록은 누구나, 수정은 본인이나 관리자, 삭제는 관리자만.
-- ────────────────────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array['purchase_requests','suppliers','jobs'] loop
    if to_regclass('public.'||t) is null then
      raise notice '건너뜀 (표 없음): %', t; continue;
    end if;
    execute format('alter table public.%I enable row level security', t);

    execute format('drop policy if exists %I on public.%I', t||'_rls_read', t);
    execute format('create policy %I on public.%I for select using (true)', t||'_rls_read', t);

    execute format('drop policy if exists %I on public.%I', t||'_rls_insert', t);
    execute format('create policy %I on public.%I for insert with check (true)', t||'_rls_insert', t);

    execute format('drop policy if exists %I on public.%I', t||'_rls_update', t);
    execute format($f$create policy %I on public.%I for update
      using (public.is_gori_admin() or (user_id is not null and auth.uid() = user_id))$f$,
      t||'_rls_update', t);

    execute format('drop policy if exists %I on public.%I', t||'_rls_delete', t);
    execute format('create policy %I on public.%I for delete using (public.is_gori_admin())',
      t||'_rls_delete', t);
  end loop;
end $$;


-- ────────────────────────────────────────────────────────────
-- 2. 견적 · 후기 · 당일알바 (phase2 표)
--    읽기·등록은 누구나, 상태 변경은 작성자 본인만.
-- ────────────────────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array['quotes','reviews','day_jobs','day_job_applications','worker_profiles'] loop
    if to_regclass('public.'||t) is null then
      raise notice '건너뜀 (표 없음): %', t; continue;
    end if;
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t||'_read', t);
    execute format('create policy %I on public.%I for select using (true)', t||'_read', t);
    execute format('drop policy if exists %I on public.%I', t||'_insert', t);
    execute format('create policy %I on public.%I for insert with check (true)', t||'_insert', t);
  end loop;

  -- 작성자 본인만 수정
  foreach t in array array['quotes','day_job_applications','day_jobs'] loop
    if to_regclass('public.'||t) is null then continue; end if;
    execute format('drop policy if exists %I on public.%I', t||'_own_update', t);
    execute format($f$create policy %I on public.%I for update
      using (user_id is not null and auth.uid() = user_id)$f$, t||'_own_update', t);
  end loop;
end $$;

-- 관심업체 · 알림은 본인 것만 (읽기도 본인 것만)
do $$
begin
  if to_regclass('public.favorites') is not null then
    alter table public.favorites enable row level security;
    drop policy if exists favorites_own on public.favorites;
    create policy favorites_own on public.favorites
      for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
  if to_regclass('public.notifications') is not null then
    alter table public.notifications enable row level security;
    drop policy if exists notifications_own on public.notifications;
    create policy notifications_own on public.notifications
      for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $$;


-- ────────────────────────────────────────────────────────────
-- 3. 채팅 · 인증 · 거래 · 시세 (phase3 표)
--    채팅과 거래는 당사자만 봅니다.
--    ⚠️ 컬럼 이름은 buyer_user_id / supplier_user_id 입니다 (buyer_id 아님).
--       실제 DB 에 돌려 보고 확인한 이름입니다.
-- ────────────────────────────────────────────────────────────
do $$
begin
  if to_regclass('public.chat_rooms') is not null then
    alter table public.chat_rooms enable row level security;
    drop policy if exists chat_rooms_own on public.chat_rooms;
    create policy chat_rooms_own on public.chat_rooms for all
      using (auth.uid() = buyer_user_id or auth.uid() = supplier_user_id)
      with check (auth.uid() = buyer_user_id or auth.uid() = supplier_user_id);
  end if;

  if to_regclass('public.chat_messages') is not null then
    alter table public.chat_messages enable row level security;
    drop policy if exists chat_msg_own on public.chat_messages;
    create policy chat_msg_own on public.chat_messages for all
      using (exists (select 1 from public.chat_rooms r
                     where r.id = room_id
                       and (auth.uid() = r.buyer_user_id or auth.uid() = r.supplier_user_id)))
      with check (exists (select 1 from public.chat_rooms r
                          where r.id = room_id
                            and (auth.uid() = r.buyer_user_id or auth.uid() = r.supplier_user_id)));
  end if;

  if to_regclass('public.supplier_prefs') is not null then
    alter table public.supplier_prefs enable row level security;
    drop policy if exists prefs_read on public.supplier_prefs;
    create policy prefs_read on public.supplier_prefs for select using (true);
    drop policy if exists prefs_write on public.supplier_prefs;
    create policy prefs_write on public.supplier_prefs for all
      using (user_id is null or auth.uid() = user_id);
  end if;

  if to_regclass('public.verifications') is not null then
    alter table public.verifications enable row level security;
    drop policy if exists verif_read on public.verifications;
    create policy verif_read on public.verifications for select using (true);
    drop policy if exists verif_insert on public.verifications;
    create policy verif_insert on public.verifications for insert with check (true);
    drop policy if exists verif_admin_write on public.verifications;
    create policy verif_admin_write on public.verifications for update
      using (public.is_gori_admin());
    drop policy if exists verif_admin_del on public.verifications;
    create policy verif_admin_del on public.verifications for delete
      using (public.is_gori_admin());
  end if;

  if to_regclass('public.orders') is not null then
    alter table public.orders enable row level security;
    drop policy if exists orders_party on public.orders;
    create policy orders_party on public.orders for all
      using (buyer_user_id is null
             or auth.uid() = buyer_user_id
             or exists (select 1 from public.suppliers s
                        where s.id::text = orders.supplier_id and s.user_id = auth.uid()));
    drop policy if exists orders_admin on public.orders;
    create policy orders_admin on public.orders for all
      using (public.is_gori_admin()) with check (public.is_gori_admin());
  end if;

  if to_regclass('public.market_prices') is not null then
    alter table public.market_prices enable row level security;
    drop policy if exists mp_read on public.market_prices;
    create policy mp_read on public.market_prices for select using (true);
    -- 시세는 관리자만 씁니다 (아무나 쓰면 가짜 시세가 올라갑니다)
    drop policy if exists mp_write on public.market_prices;
    create policy mp_write on public.market_prices for insert
      with check (public.is_gori_admin());
    drop policy if exists mp_admin_update on public.market_prices;
    create policy mp_admin_update on public.market_prices for update
      using (public.is_gori_admin());
    drop policy if exists mp_admin_del on public.market_prices;
    create policy mp_admin_del on public.market_prices for delete
      using (public.is_gori_admin());
  end if;

  if to_regclass('public.reviews') is not null then
    drop policy if exists reviews_admin_del on public.reviews;
    create policy reviews_admin_del on public.reviews for delete
      using (public.is_gori_admin());
  end if;

  -- 관리자 운영 권한 (phase4 4번 블록과 동일)
  if to_regclass('public.day_jobs') is not null then
    drop policy if exists dj_admin on public.day_jobs;
    create policy dj_admin on public.day_jobs for all
      using (public.is_gori_admin()) with check (public.is_gori_admin());
  end if;
  if to_regclass('public.quotes') is not null then
    drop policy if exists quotes_admin on public.quotes;
    create policy quotes_admin on public.quotes for all
      using (public.is_gori_admin()) with check (public.is_gori_admin());
  end if;
end $$;


-- ────────────────────────────────────────────────────────────
-- 4. 신고 · 문의 (phase7 표)
--    누구나 넣을 수 있고, 본인 것과 관리자만 봅니다.
-- ────────────────────────────────────────────────────────────
do $$
begin
  if to_regclass('public.reports') is not null then
    alter table public.reports enable row level security;
    drop policy if exists reports_insert_any on public.reports;
    create policy reports_insert_any on public.reports for insert with check (true);
    drop policy if exists reports_select_own on public.reports;
    create policy reports_select_own on public.reports for select
      using (public.is_gori_admin() or (reporter_id is not null and auth.uid() = reporter_id));
    drop policy if exists reports_admin_all on public.reports;
    create policy reports_admin_all on public.reports for all
      using (public.is_gori_admin()) with check (public.is_gori_admin());
  end if;

  if to_regclass('public.inquiries') is not null then
    alter table public.inquiries enable row level security;
    drop policy if exists inquiries_insert_any on public.inquiries;
    create policy inquiries_insert_any on public.inquiries for insert with check (true);
    drop policy if exists inquiries_select_own on public.inquiries;
    create policy inquiries_select_own on public.inquiries for select
      using (public.is_gori_admin() or (user_id is not null and auth.uid() = user_id));
    drop policy if exists inquiries_admin_all on public.inquiries;
    create policy inquiries_admin_all on public.inquiries for all
      using (public.is_gori_admin()) with check (public.is_gori_admin());
  end if;
end $$;


-- ════════════════════════════════════════════════════════════════════
--  확인 — 아래 결과를 보세요
--
--  "RLS" 가 전부 ✅ 켜짐 이고 "정책" 이 1 이상이면 성공입니다.
--  ❌ 가 하나라도 있으면 그 표가 아직 무방비입니다.
--  "정책 0" 은 반대로 너무 잠긴 것입니다 — 아무도 못 읽습니다.
-- ════════════════════════════════════════════════════════════════════
select
  c.relname                                        as "표",
  case when c.relrowsecurity then '✅ 켜짐'
       else '❌ 꺼짐 — 무방비' end                  as "RLS",
  count(p.polname)                                 as "정책",
  case when not c.relrowsecurity then '이 표는 anon 키로 지울 수 있습니다'
       when count(p.polname) = 0  then '정책이 없어 아무도 못 읽습니다'
       else '' end                                 as "확인"
from pg_class c
join pg_namespace n on n.oid = c.relnamespace and n.nspname = 'public'
left join pg_policy p on p.polrelid = c.oid
where c.relkind = 'r'
  and c.relname in ('purchase_requests','suppliers','jobs','quotes','reviews',
                    'day_jobs','day_job_applications','worker_profiles','favorites',
                    'notifications','supplier_prefs','verifications','chat_rooms',
                    'chat_messages','orders','market_prices','admins','reports','inquiries')
group by c.relname, c.relrowsecurity
order by c.relrowsecurity asc, c.relname;
