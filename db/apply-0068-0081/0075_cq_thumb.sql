-- 0075_cq_thumb · 운영 DB 판이 74 일 때만 실행합니다
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
         (select f.path from cqphoto f where f.q_id = q.id
           order by f.created_at, f.id limit 1) as thumb
    from cq q
    left join account a on a.id = q.by_user
   where q.state = 'live';
grant select on v_cq_public to anon, authenticated;
insert into schema_version (n, name) values (75, '0075_cq_thumb')
  on conflict (n) do nothing;
commit;
select max(n) as ver from schema_version;
