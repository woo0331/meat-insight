-- ════════════════════════════════════════════════════════════════════
-- DRAFT 0088 — 견적을 같은 기준으로 견주는 칸 넷 + 금액 변경 이력 (2026-11-28 대표 지시 §3)
--
-- ⚠️⚠️ db/migrations 에 넣지 않았습니다 (초안). 시험 DB(gxjz…)에만 적용했습니다.
--   운영에 올리실 때 번호를 정해 db/migrations 로 옮기고 verify.sql 기대값(표 · 함수)을 같이 고칩니다.
--   되돌리기: drop trigger quote_rev_t on quote; drop function quote_rev_log(); drop table quote_rev;
--            drop function set_quote_terms(uuid, jsonb);
--            alter table quote drop column kind, drop column site, drop column items, drop column buy_amount;
--
--   kind        가견적(est) · 확정 견적(final)        — 비면 '업체 확인 필요'
--   site        실측 필요(need) · 실측함(done) · 실측 없이(none) — 비면 '업체 확인 필요'
--   items       이 견적이 덮는 신청 서비스 id 들 (request_item.service_id) — 비면 '적용 범위 업체 확인 필요'
--   buy_amount  집기 매입 금액(원) — 공사비(amount)와 따로 · 비면 안 냄
--   quote_rev   금액 · 부가세 · 범위가 바뀔 때마다 **이전 값**을 남깁니다 (조용히 덮어쓰지 않습니다)
-- ════════════════════════════════════════════════════════════════════
begin;

drop function if exists set_quote_terms(uuid, jsonb);
alter table quote add column if not exists kind       text;
alter table quote add column if not exists site       text;
alter table quote add column if not exists items      text[];
alter table quote add column if not exists buy_amount bigint;
alter table quote drop constraint if exists quote_kind_ck;
alter table quote add  constraint quote_kind_ck check (kind is null or kind in ('est','final'));
alter table quote drop constraint if exists quote_site_ck;
alter table quote add  constraint quote_site_ck check (site is null or site in ('need','done','none'));
alter table quote drop constraint if exists quote_buy_ck;
alter table quote add  constraint quote_buy_ck check (buy_amount is null or buy_amount >= 0);

-- 직원 · 관리자가 견적 기록 뒤에 덧붙입니다 (staff_record_quote 를 다시 쓰지 않으려고 따로 둔 문)
create or replace function set_quote_terms(p_quote uuid, p_terms jsonb) returns void
  language plpgsql security definer set search_path = public as $$
declare v_role app_role := my_role(); v_req uuid; v_items text[]; v_buy bigint;
begin
  if auth.uid() is null or v_role is null or v_role not in ('staff','admin') then
    raise exception '견적 조건은 직원 · 관리자만 적습니다'; end if;
  select request_id into v_req from quote where id = p_quote;
  if v_req is null then raise exception '없는 견적입니다'; end if;
  if coalesce(p_terms->>'kind','') not in ('','est','final') then raise exception '가견적 · 확정 견적 중에서 골라 주세요'; end if;
  if coalesce(p_terms->>'site','') not in ('','need','done','none') then raise exception '실측 여부를 다시 골라 주세요'; end if;
  if jsonb_typeof(p_terms->'items') = 'array' then
    select array_agg(x) into v_items from jsonb_array_elements_text(p_terms->'items') x;
    if exists (select 1 from unnest(coalesce(v_items,'{}')) x
                where not exists (select 1 from request_item i where i.request_id = v_req and i.service_id = x)) then
      raise exception '이 신청에 없는 서비스를 적용 범위로 적었습니다'; end if;
  end if;
  if coalesce(btrim(p_terms->>'buy'),'') <> '' then
    if (p_terms->>'buy') !~ '^[0-9]{1,12}$' then raise exception '집기 매입 금액은 숫자로 적어 주세요'; end if;
    v_buy := (p_terms->>'buy')::bigint;
  end if;
  update quote set kind = nullif(p_terms->>'kind',''), site = nullif(p_terms->>'site',''),
                   items = v_items, buy_amount = v_buy, updated_at = now()
   where id = p_quote;
  -- 금액을 고친 사유 — 가장 최근의 사유 없는 변경 줄에 붙입니다 (고객이 금액 · 사유 · 변경일을 봅니다)
  if coalesce(btrim(p_terms->>'why'),'') <> '' then
    update quote_rev set why = left(btrim(p_terms->>'why'), 300)
     where id = (select id from quote_rev where quote_id = p_quote and why is null order by at desc limit 1);
  end if;
end $$;
revoke all on function set_quote_terms(uuid, jsonb) from public, anon;
grant execute on function set_quote_terms(uuid, jsonb) to authenticated;

-- 금액 변경 이력 — 고친 사람이 누구든(업체 · 운영자) 이전 값을 남깁니다
create table if not exists quote_rev (
  id          uuid primary key default gen_random_uuid(),
  quote_id    uuid not null references quote(id) on delete cascade,
  old_amount  bigint, new_amount bigint,
  old_vat     text,   new_vat    text,
  scope_changed boolean not null default false,
  why         text,
  at          timestamptz not null default now()
);
create index if not exists quote_rev_q on quote_rev (quote_id, at);
alter table quote_rev enable row level security;
drop policy if exists qrev_requester on quote_rev;
create policy qrev_requester on quote_rev for select using (exists (
  select 1 from quote q where q.id = quote_rev.quote_id and q.state <> 'withdrawn' and is_my_request(q.request_id)));
drop policy if exists qrev_staff on quote_rev;
create policy qrev_staff on quote_rev for select using (my_role() in ('staff','admin'));
drop policy if exists qrev_provider on quote_rev;
create policy qrev_provider on quote_rev for select using (exists (
  select 1 from quote q where q.id = quote_rev.quote_id and q.provider_id = my_provider()));
grant select on quote_rev to authenticated;

create or replace function quote_rev_log() returns trigger
  language plpgsql security definer set search_path = public as $$
begin
  if old.amount is distinct from new.amount or old.vat is distinct from new.vat or old.scope is distinct from new.scope then
    insert into quote_rev (quote_id, old_amount, new_amount, old_vat, new_vat, scope_changed, why)
    values (old.id, old.amount, new.amount, old.vat::text, new.vat::text, old.scope is distinct from new.scope,
            nullif(current_setting('app.quote_why', true), ''));
  end if;
  return new;
end $$;
drop trigger if exists quote_rev_t on quote;
create trigger quote_rev_t after update on quote for each row execute function quote_rev_log();

commit;
