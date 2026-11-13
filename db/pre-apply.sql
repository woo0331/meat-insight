-- ════════════════════════════════════════════════════════════════════
-- pre-apply — 골프올인원 판을 올리기 **전에** 한 번 돌립니다  (①단계)
--
-- ⚠️⚠️⚠️ **이 파일은 기존 표·데이터·함수·권한을 한 줄도 바꾸지 않습니다.**
--   바꾸는 것은 `alter default privileges` 하나뿐이고, 그것은 이 뒤에
--   **새로 만들어지는** 객체에만 걸립니다 (Postgres 문서: default
--   privileges 는 "objects created in the future" 에만 적용). 이미 있는
--   16개 표의 GRANT·RLS·정책·데이터는 그대로입니다 — 맨 아래 조회가
--   그것을 그 자리에서 보여 줍니다.
--
-- ⚠️⚠️⚠️ **왜 필요한가 — 안 돌리면 자물쇠 200개가 장식이 됩니다.**
--   이 저장소의 보안은 "표에는 GRANT 를 안 주고 **문(함수)** 으로만
--   들어간다" 입니다. 그런데 이 프로젝트(= Supabase 의 기본값)는
--     public 에 새로 생기는 **표**  → anon·authenticated 에게 arwdDxtm
--     public 에 새로 생기는 **함수** → anon·authenticated 에게 EXECUTE
--   를 **직접** 줍니다. 그러면
--     ① 마이그레이션의 `revoke all on function … from public` **200곳**이
--        전부 무력화됩니다 (`from public` 은 anon 에게 **직접** 준 권한을
--        떼지 못합니다 — 저 200곳 가운데 anon·authenticated 를 적은 곳은
--        **0곳**입니다). 내부 도움함수 `notify_one` 이 열리면 로그인한
--        누구나 아무에게 아무 제목으로 알림을 꽂을 수 있습니다 — 0050
--        머리말이 "검사가 눌러 보고 잡았다" 고 적은 바로 그 구멍입니다.
--     ② 표 단위 권한이 생기므로 **칸 단위 GRANT 가 그 표에서 풀립니다**
--        (칸 GRANT 는 표 권한이 없을 때만 자물쇠입니다). 임시 Postgres 에
--        운영과 **같은 기본 권한**을 재현해 재 보니 — 칸 GRANT 를 쓰는
--        표 46개 가운데 **11개**에서 가린 칸이 열렸습니다:
--          jobapply · joinapply · listingask · wantedreply . contact, agree_at
--          listing · joinroom · wanted · jobpost ........ contact, agree_at, hidden_by
--          teebook .................................... by_user, name, tel, agree3rd_at
--          notice ..................................... to_user
--          provider_photo ............................. by_user
--        ⚠️⚠️⚠️ **`contact` 는 동의 전에는 아무에게도 안 가야 하는 값입니다**
--        (제17조 제2항). `joinapply_owner` · `listingask` 의 판매자 정책은
--        상대의 **줄**을 보여 주고, 지금까지는 칸 GRANT 가 `contact` 를
--        가려 왔습니다. 표 권한이 붙으면 `host_share_at` 이 비어 있어도
--        신청자 연락처가 그대로 읽힙니다.
--        ⚠️ `inquiry.memo` 와 `cq.guest_pw` 는 **안 열립니다** — 0053 ·
--        0063 이 `revoke select on … from authenticated` 를 따로 적어
--        두었습니다(열 곳뿐입니다). 재 보고 확인했습니다.
--     ③ 표 **20개**에 표 단위 권한이 새로 붙습니다 (ca · cq · cqview ·
--        inquiry · jobapply · jobpost · joinapply · joinroom · listing ·
--        listingask · notice · provider_invite · provider_photo ·
--        schema_version · teebook · trip · tripdate · tripphoto · wanted ·
--        wantedreply). RLS 가 **줄**은 막아 주므로 곧바로 새지는 않지만,
--        이 저장소가 세 겹으로 둔 자물쇠 가운데 한 겹이 사라집니다.
--   ⚠️ 검사(`tools/test-sql.js`)는 평범한 Postgres 에서 돕니다. 거기는
--      기본 권한이 좁아서 이 구멍이 **영원히 초록**이었습니다.
--
-- ⚠️⚠️ **되돌리기** — 올리기가 끝나면 `db/post-apply.sql` 이 기본 권한을
--   survey ⑪ 의 값 그대로 복원합니다. 중간에 멈추셔도 그 파일만 돌리면
--   원래대로 돌아갑니다 (좁혀진 채로 두어도 손님 화면은 멀쩡합니다 —
--   좁아진 쪽이라 새 객체가 덜 열릴 뿐입니다).
--
--   돌리는 곳  Supabase → SQL Editor → New query → 붙여넣고 Run
-- ════════════════════════════════════════════════════════════════════

/* ── ① 이 뒤에 새로 생기는 객체에서만 anon·authenticated 를 뺍니다 ──
   ⚠️ `for role` 을 안 적었으므로 **지금 접속한 역할(current_user)** 이
      만드는 객체에만 걸립니다. SQL Editor 는 postgres 로 돕니다 —
      survey ⑪ 의 "public / postgres 가 만들 때" 줄이 바로 그것입니다.
      같은 표의 "supabase_admin 가 만들 때" 줄은 **건드리지 않습니다**
      (그 역할이 만드는 객체용이고, 우리는 postgres 로 만듭니다). */
alter default privileges in schema public revoke all     on tables    from anon, authenticated;
alter default privileges in schema public revoke all     on sequences from anon, authenticated;
alter default privileges in schema public revoke execute on functions from anon, authenticated;

/* ── ② 그래서 지금 무엇이 어떻게 되었는지 한 번에 보여 줍니다 ──
   ⚠️ Supabase SQL Editor 는 **마지막 결과만** 내주므로 한 문장입니다. */
with acl as (
  select n.nspname sch,
         pg_get_userbyid(d.defaclrole) grantor,
         case d.defaclobjtype when 'r' then '표·보기' when 'S' then '시퀀스'
              when 'f' then '함수' when 'T' then '타입' else d.defaclobjtype::text end kind,
         coalesce(array_to_string(d.defaclacl, ' '), '(비어 있음 = 기본값)') acl
    from pg_default_acl d join pg_namespace n on n.oid = d.defaclnamespace
   where n.nspname = 'public'
),
tb as (   /* 이미 있는 16개 표 — 권한·RLS·줄 수가 그대로인지 */
  select c.relname t, c.relrowsecurity rls,
         (select count(*) from pg_policy p where p.polrelid = c.oid) pol,
         has_table_privilege('anon', c.oid, 'select')          a_r,
         has_table_privilege('anon', c.oid, 'insert')          a_w,
         has_table_privilege('authenticated', c.oid, 'select') u_r
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind = 'r'
)
select 구분, 이름, 값1, 값2 from (
  select 1 순, '① 지금 접속한 역할' 구분, current_user::text 이름,
         'default privileges 는 이 역할이 만드는 객체에만 걸립니다' 값1, '' 값2
  union all
  select 2, '② 바뀐 기본 권한', kind, grantor || ' 가 만들 때', acl from acl
  union all
  select 3, '③ 기존 표 (그대로여야 합니다)', t,
         case when rls then 'RLS 켜짐' else 'RLS 꺼짐' end || ' · 정책 ' || pol || '개',
         'anon읽기=' || a_r || ' anon쓰기=' || a_w || ' 회원읽기=' || u_r from tb
  union all
  select 4, '④ 다음 걸음', 'db/apply-all-1.sql',
         '②번 줄에 anon·authenticated 가 없어야 합니다', '' 
) x order by x.순, x.이름;
