-- ════════════════════════════════════════════════════════════════════
-- 0037 — 후기 · 평점
-- ════════════════════════════════════════════════════════════════════
-- ⚠️⚠️⚠️ **평점을 칸에 저장하지 않습니다.** provider 표에 평점 칸이
--   없는 것은 0001 머리말이 일부러 적어 둔 것입니다 — 칸으로 두면
--   누군가 거기에 4.9 를 적어 넣고, 그 순간 지어낸 신뢰입니다
--   (절대 규칙 1 · 표시광고법 제3조). 평균과 건수는 **후기 줄에서
--   그때그때 셉니다.** 이 파일에도 집계 칸 · 집계 표가 없습니다.
--
-- ⚠️⚠️ **아무나 쓰면 후기가 아닙니다.** 상호만 알면 쓸 수 있게 두면
--   경쟁사가 별 하나를 깔고, 업체가 제 식구로 별 다섯을 깝니다. 그래서
--   **우리 DB 로 확인되는 두 가지** 중 하나가 있어야 엽니다 —
--     ① 그 업체의 견적을 **고르셨다** (quote.state = chosen)
--     ② 그 업체와 **만나셨다** (appointment.state = done)
--   둘 다 손님이 혼자 만들 수 없는 값입니다.
--   ⚠️ "상담만 받았는데 별로였다" 도 참말이지만, 우리는 그것을 확인할
--   길이 없습니다. 확인 못 하는 것을 받아 공개하면 그 글의 책임이
--   플랫폼으로 옵니다.
--
-- ⚠️⚠️ **한 요청 × 한 업체 = 한 줄입니다.** 여러 줄을 쌓게 두면 같은
--   분이 별 다섯을 열 번 적어 평균을 만듭니다. 고치는 것은 됩니다
--   (덮어씁니다) — 고친 기록은 audit_log 에 남습니다.
--
-- ⚠️⚠️ **작성자 성함을 공개 보기에 담지 않습니다.** 성 한 글자와
--   별표로 **그 자리에서 계산**합니다 (개인정보 보호법 제3조 제6항 —
--   익명 처리). 마스킹한 값을 칸에 저장하지 않습니다: 저장하면
--   원본과 어긋나는 날이 오고, 어느 쪽이 참인지 알 수 없습니다.
--
-- ⚠️⚠️ **지우는 길이 없습니다.** 운영자는 **가립니다**(hidden_at) —
--   지우면 업체가 "없는 말을 지웠다" 고 다툴 때 아무 기록이 없습니다.
--   가린 까닭은 반드시 받습니다.
--
-- ⚠️⚠️ **보기(view)는 RLS 를 지나지 않습니다** (0032 에서 겪은 자리).
--   그러니 v_review_public 의 where 절이 **자물쇠 그 자체**입니다 —
--   가린 후기 · 검사용 업체 · 공개 안 한 업체를 거기서 거릅니다.
--
-- ⚠️ 알림을 보내지 않습니다 — "후기가 달리면 알려 드립니다" 라고
--   **말하지 않습니다** (절대 규칙 5). 업체는 자기 작업실에서 봅니다.
-- ════════════════════════════════════════════════════════════════════
begin;

create table if not exists review (
  id          uuid primary key default gen_random_uuid(),
  request_id  uuid not null references request(id) on delete cascade,
  provider_id text not null references provider(id) on delete cascade,
  -- ⚠️ 1~5 입니다. 0 과 6 을 막는 것은 check 가 하고, 사람 말로 거절하는
  --   것은 문(write_review)이 합니다 — enum 오류가 손님 화면에 나가면
  --   무엇이 틀렸는지 모릅니다.
  rating      smallint not null check (rating between 1 and 5),
  body        text not null,
  -- 누가 썼나 — ⚠️ 공개 보기에는 **안 나갑니다** (마스킹한 값만).
  --   임자를 가리는 데는 안 씁니다: is_my_request() 가 참입니다
  --   (계정이 지워져도 후기는 그 요청의 것입니다).
  by_user     uuid references auth.users(id) on delete set null,
  -- 업체의 답변 — 한 줄만 둡니다 (주고받는 자리가 아닙니다)
  reply       text,
  reply_at    timestamptz,
  -- 운영자가 가린 것 — ⚠️ 지우지 않습니다
  hidden_at   timestamptz,
  hidden_why  text,
  hidden_by   uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (request_id, provider_id),
  -- ⚠️ 열 글자 미만은 후기가 아닙니다 ("좋아요" 는 아홉 글자가 안 됩니다
  --   — 그래도 열 글자를 받는 까닭은, 한 글자 후기가 평균을 움직이는
  --   것을 막기 위해서입니다). 위는 천 글자입니다.
  constraint rv_body_len  check (char_length(btrim(body)) between 10 and 1000),
  constraint rv_reply_len check (reply is null or char_length(btrim(reply)) between 1 and 1000),
  -- ⚠️⚠️ 가렸으면 까닭이 **반드시** 있습니다. 문에서도 받고 여기서도
  --   봅니다 — 문이 내려가는 날 이 줄이 남습니다.
  constraint rv_hidden_why check (hidden_at is null or btrim(coalesce(hidden_why,'')) <> '')
);
create index if not exists rv_provider_idx on review (provider_id, created_at desc);

alter table review enable row level security;

-- ── 누가 보는가 ─────────────────────────────────────────────────────
-- ⚠️⚠️ 정책 안에서 request 를 바로 읽으면 무한 재귀입니다 (0005 · 0008 ·
--   0011 · 0034 에서 겪은 자리) — is_my_request() 로 끊습니다.
drop policy if exists rv_mine on review;
create policy rv_mine on review for select
  using (is_my_request(request_id));

-- 그 업체는 자기 후기를 봅니다 (가린 것까지 — 답변할 권리가 있습니다)
drop policy if exists rv_provider on review;
create policy rv_provider on review for select
  using (provider_id = my_provider());

drop policy if exists rv_staff on review;
create policy rv_staff on review for select
  using (my_role() in ('staff','admin'));

-- ⚠️⚠️⚠️ **"로그인한 아무나 가리지 않은 후기를 읽는다" 정책을 두지
--   않습니다.** 처음에 그렇게 썼는데, 그러면 로그인한 누구나 **표를
--   바로** 읽을 수 있고 표에는 보기에 없는 칸이 둘 있습니다 —
--   `by_user`(누가 썼는가)와 `request_id`(어느 신청인가). 후기 글은
--   공개지만 **누가 썼는지는 공개가 아닙니다** (개인정보 보호법).
--   공개로 읽는 길은 **아래 보기 하나**이고, 그 보기는 이름을
--   마스킹하고 그 두 칸을 아예 담지 않습니다.
--   ⚠️ 표를 읽는 사람은 셋뿐입니다: 쓴 사람 · 그 업체 · 운영자.

-- ⚠️⚠️ **쓰기 정책을 일부러 만들지 않았습니다.** RLS 는 정책이 없으면
--   막습니다 — 쓰는 길은 아래 문 셋뿐입니다 (0008 · 0034 와 같은 규칙).
grant select on review to authenticated;


-- ════════════════════════════════════════════════════════════════════
-- 공개 보기 — 손님 화면 · tools/pull-reviews.js 가 읽습니다
--
-- ⚠️⚠️⚠️ **이 where 절이 자물쇠입니다.** 보기는 RLS 를 지나지 않습니다
--   (security_invoker 를 안 켰으니 임자 권한으로 돕니다). 0032 의
--   v_ad_live 가 바로 이 자리에서 검사용 업체의 상호를 내보내고
--   있었습니다.
-- ⚠️ request_id 를 담지 않습니다 — 후기와 신청번호를 이어 주면 누가
--   썼는지 좁혀집니다.
-- ⚠️ by_user 를 담지 않습니다. 이름은 **마스킹해서 계산**합니다.
-- ════════════════════════════════════════════════════════════════════
create or replace view v_review_public as
  select r.id, r.provider_id, r.rating, r.body,
         r.created_at, r.updated_at, r.reply, r.reply_at,
         -- 작성자 — 성 한 글자 + 별표. ⚠️ 저장하지 않고 **셉니다**.
         --   이름이 비어 있으면 "회원" 입니다 (별표만 찍으면 고장처럼
         --   보입니다).
         case
           when btrim(coalesce(a.name, '')) = '' then '회원'
           else left(btrim(a.name), 1) ||
                repeat('*', greatest(char_length(btrim(a.name)) - 1, 1))
         end as who
    from review r
    join provider p on p.id = r.provider_id
    left join account a on a.id = r.by_user
   where r.hidden_at is null
     and p.listed = true
     and p.is_test = false;

comment on view v_review_public is
  '손님 화면 · tools/pull-reviews.js 가 읽는 공개 후기. '
  'RLS 를 지나지 않으므로 where 절이 자물쇠입니다 (0037). '
  '평점 평균 · 건수는 담지 않습니다 — 줄에서 계산합니다.';

grant select on v_review_public to anon, authenticated;


-- ════════════════════════════════════════════════════════════════════
-- ① 손님이 후기를 씁니다 · 고칩니다
--
-- ⚠️⚠️ 거절하는 말을 **자물쇠마다 다르게** 적습니다. 같은 말로 거절하면
--   어느 자물쇠가 막았는지 알 수 없고, 검사가 엉뚱한 까닭으로 통과합니다.
-- ════════════════════════════════════════════════════════════════════
create or replace function write_review(p jsonb)
  returns uuid language plpgsql security definer
  set search_path = public as $$
declare
  v_me   uuid := auth.uid();
  v_pv   text := my_provider();
  v_req  uuid;
  v_pid  text := nullif(btrim(coalesce(p->>'provider', '')), '');
  v_rate int;
  v_body text := btrim(coalesce(p->>'body', ''));
  v_hid  timestamptz;
  v_was  smallint;
  v_id   uuid;
  v_ok   boolean;
begin
  if v_me is null then
    raise exception '후기는 로그인한 뒤에 쓰실 수 있습니다';
  end if;

  v_req := nullif(btrim(coalesce(p->>'request', '')), '')::uuid;
  if v_req is null then raise exception '어느 요청인지 적어 주세요'; end if;
  if v_pid is null then raise exception '어느 업체인지 적어 주세요'; end if;

  -- ⚠️⚠️ **내 요청인가.** coalesce 로 땅에 내려놓습니다 — NULL 이면
  --   if 가 안 걸려 자물쇠가 통째로 열립니다 (0034 에서 겪은 자리).
  if not coalesce(is_my_request(v_req), false) then
    raise exception '내 요청의 후기만 쓰실 수 있습니다';
  end if;

  -- ⚠️⚠️ **자기 업체에는 못 씁니다.** 업체 계정도 손님으로 요청을 넣을
  --   수 있으니 이 줄이 필요합니다 — 없으면 제 업체에 별 다섯입니다.
  if coalesce(v_pv = v_pid, false) then
    raise exception '자기 업체에는 후기를 쓸 수 없습니다';
  end if;

  -- ⚠️⚠️ **거래가 있었는가** — 우리 DB 로 확인되는 둘 중 하나입니다.
  select exists (select 1 from quote
                  where request_id = v_req and provider_id = v_pid
                    and state = 'chosen')
      or exists (select 1 from appointment
                  where request_id = v_req and provider_id = v_pid
                    and state = 'done')
    into v_ok;
  if not coalesce(v_ok, false) then
    raise exception '그 업체의 견적을 고르시거나 만나신 뒤에 후기가 열립니다';
  end if;

  -- ⚠️ 별점을 사람 말로 거절합니다. 숫자가 아닌 것이 오면 check 제약이
  --   아니라 여기서 멈춰야 합니다 (손님은 'violates check constraint'
  --   를 읽을 까닭이 없습니다).
  begin
    v_rate := (p->>'rating')::int;
  exception when others then
    v_rate := null;
  end;
  if v_rate is null or v_rate < 1 or v_rate > 5 then
    raise exception '별점을 1에서 5 사이로 골라 주세요';
  end if;

  if char_length(v_body) < 10 then
    raise exception '어떠셨는지 열 글자 이상 적어 주세요';
  end if;
  if char_length(v_body) > 1000 then
    raise exception '후기는 천 글자까지입니다';
  end if;

  -- ⚠️⚠️ **가린 후기는 고쳐서 되살릴 수 없습니다.** 고치면 가림이
  --   풀리게 두면 운영자가 가린 글이 다시 올라옵니다.
  select hidden_at, rating into v_hid, v_was from review
   where request_id = v_req and provider_id = v_pid;
  if v_hid is not null then
    raise exception '운영자가 가린 후기입니다 — 고객센터로 문의해 주세요';
  end if;

  insert into review (request_id, provider_id, rating, body, by_user, updated_at)
  values (v_req, v_pid, v_rate, v_body, v_me, now())
  on conflict (request_id, provider_id) do update
    -- ⚠️ 업체의 답변을 지우지 않습니다 — 후기를 고쳐도 답변은 그 업체의
    --   말이고, 지우는 것은 우리가 할 일이 아닙니다.
    set rating = excluded.rating, body = excluded.body,
        by_user = v_me, updated_at = now()
  returning id into v_id;

  -- ⚠️⚠️ 감사 기록에 **후기 본문 · 성함을 넣지 않습니다** — audit_log 는
  --   오래 남고 보는 사람도 넓습니다. 별점과 요청 id 로 찾아갑니다.
  insert into audit_log (by_user, by_role, obj, obj_id, from_state, to_state, data)
  values (v_me, my_role(), 'review', v_id::text,
          coalesce(v_was::text, 'none'), v_rate::text,
          jsonb_build_object('request_id', v_req, 'provider_id', v_pid));
  return v_id;
end $$;

revoke all on function write_review(jsonb) from public;
grant execute on function write_review(jsonb) to authenticated;


-- ════════════════════════════════════════════════════════════════════
-- ② 업체가 답변합니다
--
-- ⚠️ 한 줄만 둡니다. 주고받게 두면 공개된 자리에서 다툼이 길어지고,
--   그 글의 책임은 플랫폼으로 옵니다.
-- ⚠️ 별점을 바꿀 길은 없습니다 (업체가 손댈 수 있으면 후기가 아닙니다).
-- ════════════════════════════════════════════════════════════════════
create or replace function reply_review(p jsonb)
  returns void language plpgsql security definer
  set search_path = public as $$
declare
  v_me   uuid := auth.uid();
  v_pv   text := my_provider();
  v_id   uuid;
  v_body text := btrim(coalesce(p->>'reply', ''));
  r      review%rowtype;
begin
  if v_me is null then raise exception '답변은 로그인한 뒤에 쓰실 수 있습니다'; end if;
  if my_role() <> 'provider' or v_pv is null then
    raise exception '후기 답변은 그 업체가 씁니다';
  end if;
  v_id := nullif(btrim(coalesce(p->>'id', '')), '')::uuid;
  if v_id is null then raise exception '어느 후기인지 적어 주세요'; end if;

  select * into r from review where id = v_id;
  if not found then raise exception '그런 후기가 없습니다'; end if;
  -- ⚠️⚠️ coalesce 가 없으면 NULL 로 빠져 자물쇠가 열립니다
  if not coalesce(r.provider_id = v_pv, false) then
    raise exception '우리 업체의 후기가 아닙니다';
  end if;
  if r.hidden_at is not null then
    raise exception '가려진 후기에는 답변할 수 없습니다';
  end if;
  if v_body = '' then raise exception '답변을 적어 주세요'; end if;
  if char_length(v_body) > 1000 then raise exception '답변은 천 글자까지입니다'; end if;

  update review set reply = v_body, reply_at = now(), updated_at = now()
   where id = v_id;

  -- ⚠️ 답변 본문을 감사 기록에 넣지 않습니다 (공개 자리에 이미 있습니다)
  insert into audit_log (by_user, by_role, obj, obj_id, from_state, to_state, data)
  values (v_me, 'provider', 'review', v_id::text,
          case when r.reply is null then 'none' else 'reply' end, 'reply',
          jsonb_build_object('provider_id', v_pv));
end $$;

revoke all on function reply_review(jsonb) from public;
grant execute on function reply_review(jsonb) to authenticated;


-- ════════════════════════════════════════════════════════════════════
-- ③ 운영자가 가립니다 · 다시 냅니다
--
-- ⚠️⚠️ **가리는 까닭을 받습니다.** 까닭 없이 가릴 수 있으면 업체가
--   불평할 때마다 지워 주는 자리가 되고, 그러면 후기가 광고입니다.
-- ⚠️ 지우지 않습니다 — 되돌릴 수 있어야 다툼을 가릴 수 있습니다.
-- ════════════════════════════════════════════════════════════════════
create or replace function hide_review(p jsonb)
  returns void language plpgsql security definer
  set search_path = public as $$
declare
  v_me   uuid := auth.uid();
  v_role app_role := my_role();
  v_id   uuid;
  v_to   text := nullif(btrim(coalesce(p->>'to', '')), '');
  v_why  text := nullif(btrim(coalesce(p->>'why', '')), '');
  r      review%rowtype;
begin
  if v_me is null then raise exception '변경자를 알 수 없습니다'; end if;
  if not coalesce(v_role in ('staff','admin'), false) then
    raise exception '후기를 가리는 것은 운영자만 할 수 있습니다';
  end if;
  v_id := nullif(btrim(coalesce(p->>'id', '')), '')::uuid;
  if v_id is null then raise exception '어느 후기인지 적어 주세요'; end if;
  if v_to not in ('hide','show') then
    raise exception '후기는 가리기 · 다시 내기로만 옮깁니다';
  end if;

  select * into r from review where id = v_id;
  if not found then raise exception '그런 후기가 없습니다'; end if;

  if v_to = 'hide' then
    if r.hidden_at is not null then raise exception '이미 가려진 후기입니다'; end if;
    if v_why is null then raise exception '가리시는 까닭을 적어 주세요'; end if;
    update review set hidden_at = now(), hidden_why = v_why, hidden_by = v_me,
                      updated_at = now()
     where id = v_id;
  else
    if r.hidden_at is null then raise exception '가려진 후기가 아닙니다'; end if;
    update review set hidden_at = null, hidden_why = null, hidden_by = null,
                      updated_at = now()
     where id = v_id;
  end if;

  insert into audit_log (by_user, by_role, obj, obj_id, from_state, to_state, why, data)
  values (v_me, v_role, 'review', v_id::text,
          case when r.hidden_at is null then 'shown' else 'hidden' end,
          case when v_to = 'hide' then 'hidden' else 'shown' end,
          v_why, jsonb_build_object('provider_id', r.provider_id));
end $$;

revoke all on function hide_review(jsonb) from public;
grant execute on function hide_review(jsonb) to authenticated;

insert into schema_version (n, name) values (37, '0037_review')
on conflict (n) do nothing;

commit;
