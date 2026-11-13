-- ════════════════════════════════════════════════════════════════════
-- post-apply — 골프올인원 판을 다 올린 **뒤에** 한 번 돌립니다  (⑦단계)
--
-- 하는 일 둘
--   ① 기본 권한을 **survey ⑪ 의 값 그대로** 되돌립니다.
--      그러면 이 프로젝트의 설정이 올리기 전과 **똑같아집니다** —
--      그쪽 서비스가 앞으로 표를 하나 더 만들어도 전과 같이 동작합니다.
--      우리 객체는 이미 **깨끗하게 태어났으므로** 되돌려도 안 열립니다
--      (default privileges 는 과거 객체를 거슬러 바꾸지 않습니다).
--   ② 자물쇠가 제대로 걸렸는지 · 필요한 길은 열렸는지 **그 자리에서**
--      눌러서 보여 줍니다.
--
-- ⚠️⚠️⚠️ **마이그레이션을 더 올리는 날(0082…)에는 db/pre-apply.sql 을
--   먼저 다시 돌리세요.** 안 돌리면 그 새 표·새 함수만 anon 에게 열린
--   채로 태어납니다 (이 파일이 기본값을 되돌려 놓았기 때문입니다).
--
-- ⚠️ 기본 권한을 **좁힌 채로 두고 싶으시면** 아래 ① 세 줄을 지우고
--   돌리시면 됩니다. 그러면 앞으로 public 에 생기는 모든 객체가
--   명시적으로 GRANT 한 것만 열립니다 — 더 안전하지만 그쪽 서비스의
--   앞날 설정을 바꾸는 일이므로 **따로 결정하실 일**입니다.
-- ════════════════════════════════════════════════════════════════════

/* ── ① 기본 권한 복원 (survey ⑪: tables arwdDxtm · sequences rwU · functions X) ── */
alter default privileges in schema public grant all     on tables    to postgres, anon, authenticated, service_role;
alter default privileges in schema public grant all     on sequences to postgres, anon, authenticated, service_role;
alter default privileges in schema public grant execute on functions to postgres, anon, authenticated, service_role;

/* ── ② 눌러서 확인 — 한 문장(마지막 결과만 나오므로) ── */
with acl as (
  select case d.defaclobjtype when 'r' then '표·보기' when 'S' then '시퀀스'
              when 'f' then '함수' else d.defaclobjtype::text end kind,
         pg_get_userbyid(d.defaclrole) grantor,
         coalesce(array_to_string(d.defaclacl, ' '), '(비어 있음)') acl
    from pg_default_acl d join pg_namespace n on n.oid = d.defaclnamespace
   where n.nspname = 'public'
),
f1 as (  /* 아무에게도 안 열려야 하는 **내부 함수 31개**
            — `revoke … on function … from public` 만 걸려 있고 anon ·
            authenticated 에게는 한 번도 grant 하지 않은 것들입니다.
            ⚠️ 넓은 기본 권한에서는 이 31개가 **전부** 열립니다 (임시
               Postgres 에서 0/31 ↔ 31/31 로 재 확인했습니다).
            ⚠️⚠️ `notify_one` 이 열리면 **아무에게 아무 제목으로 알림을
               꽂을 수** 있습니다 — 0050 머리말이 적어 둔 그 구멍입니다.
            ⚠️ `my_role` · `confirm_fee` 류는 여기 **없습니다** — 운영자
               화면이 실제로 부르는 문이고, 함수 안에서 역할을 보고
               거절합니다. 그런 것을 여기 적으면 멀쩡한 DB 를 ❌ 로
               잡습니다. */
  select p.proname nm,
         has_function_privilege('anon', p.oid, 'execute')          a,
         has_function_privilege('authenticated', p.oid, 'execute')  u
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public'
     and p.proname = any (array[
       'claim_photo_slot','course_norm','cq_ip_hash','cq_pw_blocked',
       'nick_taken_word','notice_answer','notice_hidden','notice_hidden_listing',
       'notice_hidden_wanted','notice_inquiry','notice_jobapply','notice_jobmoved',
       'notice_joinapply','notice_joinmoved','notice_listingask','notice_listingmoved',
       'notice_quote','notice_teebook','notice_teemoved','notice_wantedmoved',
       'notice_wantedreply','notify_one','provider_ident_guard','save_request_items',
       'teetime_link_course','trip_apply','trip_fields','trip_touch_draft',
       'watch_job','watch_join','watch_listing'])
),
f2 as (  /* 손님·회원이 실제로 쓰는 문 — 하나라도 false 면 ❌ */
  select p.proname nm,
         has_function_privilege('anon', p.oid, 'execute')          a,
         has_function_privilege('authenticated', p.oid, 'execute')  u
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public'
     and p.proname in ('make_request','make_apply','open_inquiry','bump_ad',
                       'open_listing','ask_listing','open_joinroom','fav_listing',
                       'write_review','save_watch','set_my_nick','read_notice')
),
cols as ( /* 칸 단위 자물쇠가 살아 있나 — 가린 칸은 f · 보이는 칸은 t 여야 합니다.
             ⚠️ 이 열한 짝은 넓은 기본 권한에서 **실제로 열리는 것**을 재서
                고른 것입니다 (`contact` 는 동의 전 연락처 · 제17조 제2항). */
  select * from (values
    ('jobapply',       'contact',     'id'),
    ('joinapply',      'contact',     'id'),
    ('listingask',     'contact',     'id'),
    ('wantedreply',    'contact',     'id'),
    ('listing',        'contact',     'id'),
    ('joinroom',       'contact',     'id'),
    ('wanted',         'contact',     'id'),
    ('jobpost',        'hidden_by',   'id'),
    ('teebook',        'tel',         'id'),
    ('notice',         'to_user',     'id'),
    ('provider_photo', 'by_user',     'id')
  ) v(t, hidden, shown)
),
vws as (  /* 비로그인이 읽어야 하는 **공개 보기 25개**.
             ⚠️ 나머지 보기(회원 전용 · `v_*_mine` 등)는 anon 에게 닫혀
                있는 것이 **맞습니다** — 전부 열려야 한다고 적으면 멀쩡한
                DB 를 ❌ 로 잡습니다. */
  select c.relname nm, has_table_privilege('anon', c.oid, 'select') a
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind = 'v'
     and c.relname = any (array[
       'v_ad_live','v_ca_public','v_course_count','v_course_public',
       'v_cq_photo_public','v_cq_public','v_job_open','v_join_count','v_join_open',
       'v_listing_open','v_listing_photo_public','v_provider_card',
       'v_provider_photo_public','v_provider_price_public','v_review_public',
       'v_teetime_count','v_teetime_open','v_trip_date_public','v_trip_open',
       'v_trip_photo_public','v_wanted_open'])
     /* ⚠️ 0067 이 만든 `v_listing_count` · `v_job_count` · `v_wanted_count` ·
        `v_cq_count` 넷은 **0068 이 drop** 했습니다 — 처음에 그 넷을 여기
        적어 두어 "25개를 찾아야 합니다" 가 21개로 나왔습니다. 마이그레이션
        전부를 올린 DB 에서 **세어서** 고쳤습니다. */
)
select 구분, 이름, 값1, 값2 from (
  select 1 순, '① 기본 권한 (survey ⑪ 과 같아야 합니다)' 구분, kind 이름,
         grantor || ' 가 만들 때' 값1, acl 값2 from acl
  union all
  select 2, '② 막혀 있어야 하는 내부 함수',
         '찾은 것 ' || count(*) || '개 (31개여야 합니다)',
         '열려 있는 것 ' || count(*) filter (where a or u) || '개',
         case when count(*) <> 31 then '❌ 목록이 썩었습니다 — ' || count(*) || '개만 찾았습니다'
              when count(*) filter (where a or u) > 0
              then '❌ ' || string_agg(nm, ', ') filter (where a or u) || ' 가 열려 있습니다'
              else '✅ 31개 전부 막혀 있습니다' end from f1
  union all
  select 3, '③ 열려 있어야 하는 문', nm,
         'anon=' || a || ' 회원=' || u,
         case when u then '✅' else '❌ 회원이 못 씁니다' end from f2
  union all
  select 4, '④ 칸 단위 자물쇠', t || '.' || hidden,
         '가린 칸 회원읽기=' || has_column_privilege('authenticated', t::regclass, hidden, 'select') ||
         ' / 보이는 칸=' || has_column_privilege('authenticated', t::regclass, shown, 'select'),
         case when has_column_privilege('authenticated', t::regclass, hidden, 'select')
              then '❌ 가린 칸이 읽힙니다' else '✅' end from cols
  union all
  select 5, '⑤ 공개 보기 (비로그인 읽기)',
         '공개 보기 ' || count(*) || '개 (21개를 찾아야 합니다)',
         'anon 이 읽는 것 ' || count(*) filter (where a),
         case when count(*) = 21 and count(*) filter (where a) = 21 then '✅'
              when count(*) <> 21 then '❌ 보기 ' || count(*) || '개만 찾았습니다'
              else '❌ ' || (21 - count(*) filter (where a)) || '개가 안 열렸습니다' end from vws
  union all
  select 6, '⑥ 판 번호', '적용된 마지막 판',
         (select max(n)::text from schema_version), '81 이어야 합니다'
) x order by x.순, x.이름;
