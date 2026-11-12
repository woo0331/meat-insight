-- ════════════════════════════════════════════════════════════════════
-- 0075 — 커뮤니티 목록에 **첫 사진 한 장**을 같이 냅니다
--        (2026-11-12 · 확정 시안 ⑩ 의 목록 썸네일)
--
-- 시안의 글 목록이 오른쪽에 **작은 사진**을 답니다. 지금 공개 보기는
-- `photo_n`(몇 장인지)만 내고 **어느 사진인지**를 안 내서, 화면이 글
-- 스무 줄마다 사진을 따로 물어봐야 합니다.
--
-- ⚠️⚠️ 0068 이 매물에서 세운 그 규칙입니다 — "안 내면 카드마다 사진을
--   따로 물어보게 되어 스무 장이면 호출이 스무 번 늘고, 그동안 카드가
--   비어 있어 **사진 없는 장터**로 보입니다."
--
-- ⚠️ **칸 하나만 더합니다.** 표도 문도 안 건드립니다.
-- ⚠️⚠️ **create or replace view 는 칸을 못 늘립니다** — drop + create
--   이고 GRANT 를 **바로 다시** 줍니다 (0044 가 밟은 자리).
-- ⚠️ 체인: v_cq_public 0047 → 0059 → 0063 → **0075**
--
-- ⚠️ 되돌아갔는지 보는 법:
--     select count(*) from information_schema.columns
--      where table_name = 'v_cq_public' and column_name = 'thumb';
-- ════════════════════════════════════════════════════════════════════
drop view if exists v_cq_public;
create view v_cq_public as
  select q.id, q.cat, q.title, q.body, q.created_at, q.updated_at,
         case
           when q.by_user is null then btrim(coalesce(q.guest_nick, '손님'))
           when btrim(coalesce(a.nick, '')) <> '' then btrim(a.nick)
           when btrim(coalesce(a.name, '')) = '' then '회원'
           else left(btrim(a.name), 1) ||
                repeat('*', greatest(char_length(btrim(a.name)) - 1, 1))
         end as who,
         (q.by_user is null or btrim(coalesce(a.nick, '')) <> '') as named,
         (q.by_user is null) as guest,
         coalesce(q.by_user = auth.uid(), false) as mine,
         (select count(*) from ca where ca.q_id = q.id and ca.state = 'live') as answer_n,
         (select count(*) from cqview v where v.q_id = q.id) as view_n,
         (select count(*) from cqphoto f where f.q_id = q.id) as photo_n,
         -- ⚠️⚠️ **올린 차례로 첫 장**입니다. cqphoto 에는 ord 가 없으므로
         --   created_at · id 로 가릅니다 — 두 글이 같은 순간에 올라와도
         --   id 가 갈라 주므로 **늘 같은 장**이 나옵니다(화면이 새로고침
         --   할 때마다 다른 사진을 내지 않게).
         (select f.path from cqphoto f where f.q_id = q.id
           order by f.created_at, f.id limit 1) as thumb
    from cq q
    left join account a on a.id = q.by_user
   where q.state = 'live';
grant select on v_cq_public to anon, authenticated;

insert into schema_version (n, name) values (75, '0075_cq_thumb')
  on conflict (n) do nothing;
