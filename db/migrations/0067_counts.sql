-- ════════════════════════════════════════════════════════════════════
-- 0067 — 중고 · 인력 · 구합니다 · 게시판의 **세는 보기** 넷
--
-- 왜 이것이 필요한가
--   0060 이 부킹 · 조인에 "날짜 · 지역별 현황" 을 세웠습니다. 손님은 그
--   표에서 **어디에 무엇이 있는지**를 먼저 보고 목록으로 들어갑니다.
--   나머지 네 자리(중고 · 인력 · 구합니다 · 게시판)에는 그 표가 없어서,
--   들어오신 분이 **목록부터** 보셨습니다 — 서울에 아이언이 몇 개
--   올라와 있는지 알려면 쉰 줄을 밀어 내려가야 했습니다.
--
-- ⚠️⚠️⚠️ **가로축에 날짜를 쓰지 않습니다.** 부킹 · 조인은 "언제 치느냐"
--   가 물건이라 날짜가 축이지만, 중고채 · 구인 글 · 구합니다 글은
--   **날짜로 찾는 것이 아닙니다**(올라온 날이 축이면 어제 글이 매일
--   한 칸씩 밀려 나가는 표가 됩니다). 그래서 축은 —
--     중고      물건 종류(sub) x 지역
--     인력      갈래(kind)     x 지역
--     구합니다  분류(cat) · 하위(sub) x 지역
--     게시판    게시판(cat)뿐 — cq 표에 **지역 칸이 없습니다**
--   없는 축을 지어내지 않습니다(절대 규칙 1).
--
-- ⚠️⚠️⚠️ **앞 번호의 공개 보기 위에 얹지 않습니다.** 0060 이
--   `v_join_count` 를 `v_join_open`(0046) 위에 세우려다 멈췄던 자리입니다 —
--   0046 이 제 보기를 `drop view` 하려 할 때
--   "cannot drop view v_join_open because other objects depend on it" 으로
--   **붙여넣기 파일 두 번째 실행이 거기서 멈춥니다**(test-upgrade ⑧).
--   그래서 이 파일의 보기 넷은 **표에서 직접 셉니다.**
--   ⚠️⚠️ 그 대가로 **조건이 두 곳**에 적힙니다. 어긋나면 표의 숫자와
--   목록의 줄 수가 다른데 **에러가 한 줄도 안 납니다** — 그래서
--   `tools/sql/counts.js` 가 **줄마다**(칸마다) 두 값을 맞춰 봅니다.
--   ⚠️ 총합으로 맞춰 보면 안 됩니다 — 한쪽이 더 세고 한쪽이 덜 세면
--   상쇄되어 **엉뚱한 까닭으로 통과**합니다(0060 에서 적어 둔 그 줄).
--
-- ⚠️⚠️ **숫자만 냅니다.** 이 보기 넷에는 제목 · 본문 · 연락처 · 글쓴이가
--   한 칸도 없습니다. 보기는 RLS 를 지나지 않으므로(임자 권한으로 돕니다)
--   **담은 칸이 곧 공개 범위**입니다 — 세는 자리에 글 내용을 담으면
--   가린 글 · 내린 글의 제목이 거기로 새어 나갑니다.
--
-- ⚠️⚠️⚠️ **같은 번에 `v_job_open` 의 UTC 버그를 고칩니다.** 0048 이
--   `close_at >= current_date` 로 적었는데 Supabase 는 UTC 라, 한국 시각
--   00:00~09:00 에는 UTC 가 아직 **어제**입니다 — 어제 마감된 구인 글이
--   한국 아침에 아직 열린 것으로 보였습니다(0046 의 `v_join_open` 이
--   밟고 0060 이 고친 그 자리). 세는 보기가 `kst_today()` 를 쓰는데
--   목록 보기가 `current_date` 를 쓰면 **그 아홉 시간 동안 표와 목록이
--   다른 수**를 말하고, 검사는 그 시각에만 떨어집니다.
--   ⚠️ 고치는 길은 보기를 다시 만드는 것뿐이라 **체인이 하나 늘어납니다**
--   (v_job_open 0048 → 0067). `check-chains` 가 셉니다.
--
-- 되돌아갔는지 보는 법 (0048 을 따로 다시 붙여 넣으면 조용히 되돌아갑니다)
--   select pg_get_viewdef('v_job_open'::regclass) ilike '%kst_today%';   -- t 여야
--   select count(*) from information_schema.views
--    where table_name in ('v_listing_count','v_job_count',
--                         'v_wanted_count','v_cq_count');                -- 4
-- ════════════════════════════════════════════════════════════════════


begin;


-- ── ① 중고 매물 — 물건 종류 x 지역 ────────────────────────────────
-- ⚠️ 조건은 `v_listing_open`(0056)과 **같아야 합니다**: state = 'open'.
--   팔린 것 · 내린 것 · 가린 것은 목록에 없으므로 표에도 없습니다.
-- ⚠️⚠️ 값(price)으로는 **안 나눕니다** — 가격대는 손님이 고르는 거르개이고
--   표의 축이 아닙니다. 축으로 두면 칸이 7 x 6 x 5 가 되어 못 읽습니다.
drop view if exists v_listing_count;
create view v_listing_count as
  select l.sub, l.region, count(*)::int as n
    from listing l
   where l.state = 'open'
   group by l.sub, l.region;

grant select on v_listing_count to anon, authenticated;


-- ── ② 구인 · 구직 · 제휴 — 갈래 x 지역 ────────────────────────────
-- ⚠️⚠️ 0048 이 한 표에 셋을 담았으므로(`kind`) 세로축이 **갈래 셋**입니다.
--   하위(sub)를 축으로 두면 6 x 6 인데, 손님이 먼저 묻는 것은
--   "구인인가 구직인가" 입니다 — 하위는 거르개로 둡니다.
-- ⚠️ 마감일이 지난 글은 목록에서 빠지므로 **표에서도 빠집니다**.
--   날짜는 **한국 날짜**입니다(아래 ⑤ 에서 목록 보기도 같이 고칩니다).
drop view if exists v_job_count;
create view v_job_count as
  select j.kind, j.region, count(*)::int as n
    from jobpost j
   where j.state = 'open'
     and (j.close_at is null or j.close_at >= kst_today())
   group by j.kind, j.region;

grant select on v_job_count to anon, authenticated;


-- ── ③ 구합니다 — 분류 · 하위 x 지역 ───────────────────────────────
-- ⚠️⚠️ 이 보기는 **분류까지** 담습니다 — 구합니다는 `/cat/lesson` 처럼
--   분류 화면마다 서는 자리라, 화면이 제 분류로 좁혀 읽습니다.
-- ⚠️⚠️⚠️ **`sub` 은 비어 있을 수 있습니다**(0061 — 하위를 모르고 적으시는
--   분이 있어 필수가 아닙니다). group by 가 null 을 **한 칸으로 모으므로**
--   그 줄이 그대로 나오고, 화면은 그 칸을 어느 하위 줄에도 안 더합니다 —
--   더하면 손님이 안 고른 하위에 글이 있는 것처럼 보입니다(절대 규칙 1).
--   ⚠️ 화면이 그 사실을 **그 자리에서** 말합니다("하위를 안 적은 글은
--   표에 안 들어갑니다" — 숨기면 목록 수와 표의 합이 달라 보입니다).
drop view if exists v_wanted_count;
create view v_wanted_count as
  select w.cat, w.sub, w.region, count(*)::int as n
    from wanted w
   where w.state = 'open'
   group by w.cat, w.sub, w.region;

grant select on v_wanted_count to anon, authenticated;


-- ── ④ 게시판 — 게시판마다 글 수 ───────────────────────────────────
-- ⚠️⚠️ **표를 만들지 않습니다.** `cq` 에는 지역 칸이 **없습니다** — 없는
--   축을 만들려면 칸을 새로 만들어야 하고, 칸을 만들면 누군가 채웁니다.
--   그래서 가로축 없이 **게시판마다 한 숫자**입니다.
-- ⚠️ 조건은 `v_cq_public`(0063)과 같습니다: state = 'live'.
--   내린 글 · 가린 글은 목록에 없으므로 숫자에도 없습니다.
-- ⚠️⚠️ **조회 수 · 댓글 수를 여기서 안 셉니다** — 그 둘은 이미
--   `v_cq_public` 이 글마다 세어 냅니다. 두 곳에서 세면 한쪽만 고치는 날
--   같은 게시판이 화면마다 다른 수를 말합니다.
drop view if exists v_cq_count;
create view v_cq_count as
  select q.cat, count(*)::int as n
    from cq q
   where q.state = 'live'
   group by q.cat;

grant select on v_cq_count to anon, authenticated;


-- ── ⑤ v_job_open — `current_date`(UTC) 를 `kst_today()` 로 ─────────
-- ⚠️⚠️⚠️ **0048 의 본문을 그대로 두고 날짜 함수만 바꿉니다.** 칸을
--   늘리거나 줄이지 않습니다 — 줄이면 `js/career.js` 가 읽는 칸이
--   사라지고, 늘리면 0048 을 다시 붙여 넣을 때
--   "cannot drop columns from view" 로 멈춥니다.
--   ⚠️ 그래서 `create or replace` 가 아니라 **drop + create** 이고,
--   GRANT 를 **바로 다시** 줍니다(지우면 권한도 같이 날아갑니다 — 0044 가
--   그 자리에서 `pull-providers` 를 permission denied 로 만들 뻔했습니다).
drop view if exists v_job_open;
create view v_job_open as
  select j.id, j.kind, j.sub, j.region, j.title, j.body, j.pay, j.terms,
         j.close_at, j.created_at, j.updated_at,
         case
           when btrim(coalesce(ac.name, '')) = '' then '회원'
           else left(btrim(ac.name), 1) ||
                repeat('*', greatest(char_length(btrim(ac.name)) - 1, 1))
         end as who,
         case when pv.id is not null and pv.state = 'approved'
                   and pv.is_test = false
              then pv.name end as pro_name,
         (select count(*) from jobapply a
           where a.post_id = j.id and a.state in ('applied','accepted')) as apply_n
    from jobpost j
    left join account  ac on ac.id = j.by_user
    left join provider pv on pv.id = j.provider_id
   where j.state = 'open'
     and (j.close_at is null or j.close_at >= kst_today());

grant select on v_job_open to anon, authenticated;


insert into schema_version (n, name) values (67, '0067_counts')
  on conflict (n) do nothing;

commit;
