-- ════════════════════════════════════════════════════════════════════
-- 0051 — 업체가 올리는 **시설 사진**과 **증빙서류**
-- ════════════════════════════════════════════════════════════════════
-- ⚠️⚠️⚠️ **둘은 같은 것이 아닙니다.** 한 표에 담되 `kind` 로 가르고,
--   **보는 길을 완전히 다르게** 둡니다 —
--     photo 시설 사진 — 손님 **누구나** 봅니다 (카드 · 업체 상세)
--     doc   증빙서류   — **운영자와 그 업체만** 봅니다 (심사용)
--   증빙서류가 공개로 새면 그건 사업자등록증 · 자격증이 인터넷에 올라간
--   것입니다. 그래서 자물쇠를 **세 겹**으로 둡니다:
--     ① 공개 보기(`v_provider_photo_public`)가 `kind = 'photo'` 만 냅니다
--        — 서류는 그 보기에 **아예 안 담깁니다**
--     ② 표의 RLS 가 그 업체와 운영자에게만 줄을 보여 줍니다
--     ③ 경로가 갈래를 **글자로** 들고 있고(`pv/<id>/photo/…` ·
--        `pv/<id>/doc/…`) 표의 check 가 그것을 봅니다 — 서버가 버킷을
--        고를 때 그 경로를 보므로, 문이 내려가도 이 줄이 남습니다
--   ⚠️ 셋을 **따로** 눌러 봅니다 (`tools/sql/pvphoto.js`).
--
-- ⚠️⚠️ **버킷이 둘입니다.** 공개 사진은 정적 HTML 에 `<img>` 로 찍히므로
--   (빌드가 `pull-providers.js` 의 자료를 읽습니다) **10분짜리 서명
--   주소를 쓸 수 없습니다** — 공개 버킷이라야 합니다. 서류는 그 반대로
--   비공개 버킷입니다.
--     photo → PROVIDER_BUCKET (공개)
--     doc   → INTAKE_BUCKET   (비공개 · 손님 사진과 같은 버킷)
--   ⚠️⚠️⚠️ **버킷은 서버가 `kind` 로 고릅니다** — 화면이 보낸 값으로
--   고르면 거기가 바로 구멍입니다 (`api/upload.js`).
--
-- ⚠️ **검사용 업체의 사진은 공개로 안 나갑니다** (`is_test = false`) —
--   0032 에서 광고 보기가 검사용 상호를 내보낼 뻔한 그 자리입니다.
--
-- ⚠️ **파일 이름을 담지 않습니다** (0011 과 같은 까닭) — 원래 이름에는
--   성함 · 상호가 들어 있기 쉽고, 담으면 그게 또 하나의 사본입니다.
--   경로는 **여기서** 만듭니다.
--
-- 되돌아갔는지 보는 법
--   select 1 from pg_proc where proname = 'claim_provider_photo';
--   select count(*) from information_schema.columns
--    where table_name = 'v_provider_photo_public';   -- 6 이어야 합니다
-- ════════════════════════════════════════════════════════════════════
begin;

-- ════════════════════════════════════════════════════════════════════
-- ① 한 장
-- ════════════════════════════════════════════════════════════════════
create table if not exists provider_photo (
  id          uuid primary key default gen_random_uuid(),
  provider_id text not null references provider(id) on delete cascade,
  -- photo 시설 사진 (공개) · doc 증빙서류 (운영자 · 그 업체만)
  kind        text not null check (kind in ('photo','doc')),
  -- 버킷 안의 경로 — ⚠️ 파일 자체는 Storage 에 있습니다
  path        text not null unique,
  mime        text not null,
  bytes       bigint not null,
  -- 사진 설명 — ⚠️ 서류에는 안 보여 줍니다 (공개 보기에만 나갑니다)
  caption     text,
  by_user     uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  -- ⚠️⚠️ 받는 형식 · 크기를 **DB 가** 정합니다 (0011 과 같은 값이어야
  --   합니다 — `api/upload.js` 의 OK_MIME · MAX_BYTES 와 셋이 같습니다)
  constraint pvphoto_mime_ok check (mime in
    ('image/jpeg','image/png','image/webp','application/pdf')),
  constraint pvphoto_bytes_ok check (bytes > 0 and bytes <= 8388608),
  constraint pvphoto_caption_ok check
    (caption is null or char_length(btrim(caption)) <= 60),
  -- ⚠️⚠️⚠️ **경로가 갈래를 글자로 들고 있습니다.** 서버가 버킷을 고를
  --   때 이 경로를 보므로, 문이 내려가도 이 줄이 남습니다. 서류 경로에
  --   photo 가 붙는 일이 없습니다.
  constraint pvphoto_path_ok check (
    path <> '' and length(path) <= 300
    and path = 'pv/' || provider_id || '/' || kind || '/' ||
               substring(path from '[^/]+$')),
  -- ⚠️ 사진에만 JPG · PNG · WEBP, 서류에만 PDF — 섞이면 공개 보기에
  --   PDF 가 `<img>` 로 나가고 화면이 깨집니다
  constraint pvphoto_kind_mime_ok check (
    (kind = 'photo' and mime <> 'application/pdf')
    or (kind = 'doc' and mime = 'application/pdf'))
);
create index if not exists pvphoto_pv_idx
  on provider_photo (provider_id, kind, created_at);

-- ════════════════════════════════════════════════════════════════════
-- ② 공개 보기 — ⚠️⚠️ **where 절이 자물쇠 그 자체입니다**
--   보기는 RLS 를 지나지 않습니다 (임자 권한으로 돕니다). 그래서 여기
--   담지 않은 것은 **어떤 정책으로도** 새어 나가지 않습니다.
--   ⚠️⚠️⚠️ `kind = 'photo'` — **증빙서류는 이 보기에 아예 안 담깁니다.**
--   ⚠️ `is_test = false` — 검사용 업체 사진이 손님에게 나가지 않습니다.
--   ⚠️ `by_user` 를 안 담습니다 (누가 올렸는지는 공개가 아닙니다).
-- ════════════════════════════════════════════════════════════════════
drop view if exists v_provider_photo_public;
create view v_provider_photo_public as
  select ph.id, ph.provider_id, ph.path, ph.mime, ph.caption, ph.created_at
    from provider_photo ph
    join provider p on p.id = ph.provider_id
   where ph.kind = 'photo'
     and p.state = 'approved'
     and p.listed = true
     and p.is_test = false;
grant select on v_provider_photo_public to anon, authenticated;

-- ════════════════════════════════════════════════════════════════════
-- ③ 자물쇠 — RLS 로 줄을
-- ════════════════════════════════════════════════════════════════════
alter table provider_photo enable row level security;

-- 그 업체의 담당자 — ⚠️ 제 것만 (서류 포함)
drop policy if exists pvphoto_mine on provider_photo;
create policy pvphoto_mine on provider_photo for select
  using (my_provider() is not null and provider_id = my_provider());
drop policy if exists pvphoto_staff on provider_photo;
create policy pvphoto_staff on provider_photo for select
  using (my_role() in ('staff','admin'));

-- ⚠️⚠️ 쓰기는 **한 줄도 주지 않습니다** — 들어오는 길은 아래 문 둘뿐.
grant select (id, provider_id, kind, path, mime, bytes, caption, created_at)
  on provider_photo to authenticated;

-- ════════════════════════════════════════════════════════════════════
-- ④ 문 — 올릴 자리를 하나 받습니다
--   ⚠️ 0011 과 달리 **로그인한 업체 담당자**가 부릅니다 (service key 가
--   아닙니다) — 올리시는 분이 누구인지 토큰으로 압니다.
-- ════════════════════════════════════════════════════════════════════
create or replace function claim_provider_photo(p jsonb)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_uid   uuid := auth.uid();
  v_pv    text := my_provider();
  v_kind  text := nullif(btrim(coalesce(p->>'kind','')), '');
  v_mime  text := lower(nullif(btrim(coalesce(p->>'mime','')), ''));
  v_bytes bigint := nullif(btrim(coalesce(p->>'bytes','')), '')::bigint;
  v_cap   text := nullif(btrim(coalesce(p->>'caption','')), '');
  v_ext   text;
  v_path  text;
  v_id    uuid;
  v_n     int;
begin
  if v_uid is null then raise exception '로그인이 필요합니다'; end if;
  if my_role() <> 'provider' or v_pv is null then
    raise exception '업체 계정으로 로그인하셔야 합니다';
  end if;
  if not exists (select 1 from provider where id = v_pv) then
    raise exception '연결된 업체를 찾을 수 없습니다';
  end if;
  if v_kind not in ('photo','doc') then
    raise exception '사진인지 서류인지 골라 주세요';
  end if;
  -- ⚠️⚠️ 갈래와 형식이 **짝**이어야 합니다 — 섞이면 공개 보기에 PDF 가
  --   사진으로 나갑니다 (표의 check 도 같은 것을 봅니다).
  if v_kind = 'photo' and v_mime not in ('image/jpeg','image/png','image/webp') then
    raise exception '사진은 JPG · PNG · WEBP 만 올리실 수 있습니다';
  end if;
  if v_kind = 'doc' and v_mime <> 'application/pdf' then
    raise exception '서류는 PDF 만 올리실 수 있습니다';
  end if;
  if v_bytes is null or v_bytes <= 0 or v_bytes > 8388608 then
    raise exception '한 장에 8MB 까지 올리실 수 있습니다';
  end if;
  if v_cap is not null and char_length(v_cap) > 60 then
    raise exception '사진 설명이 너무 깁니다 (60자)';
  end if;

  -- ⚠️ 몇 장까지 — 사진 열 장 · 서류 다섯 장. 안 막으면 버킷이
  --   쓰레기통이 되고, 카드에 사진이 백 장 달립니다.
  select count(*) into v_n from provider_photo
   where provider_id = v_pv and kind = v_kind;
  if v_kind = 'photo' and v_n >= 10 then
    raise exception '사진은 열 장까지입니다. 먼저 빼 주세요';
  end if;
  if v_kind = 'doc' and v_n >= 5 then
    raise exception '서류는 다섯 장까지입니다. 먼저 빼 주세요';
  end if;

  v_ext := case v_mime when 'image/jpeg' then 'jpg'
                       when 'image/png'  then 'png'
                       when 'image/webp' then 'webp'
                       else 'pdf' end;
  -- ⚠️⚠️ **경로를 여기서 만듭니다.** 화면이 보낸 이름을 쓰면 `../` 같은
  --   것이 섞이고, 원래 파일 이름에는 성함 · 상호가 들어 있기도 합니다.
  --   ⚠️ 갈래가 경로에 **글자로** 들어갑니다 — 서버가 버킷을 그걸로
  --   고르고, 표의 check 가 그것을 봅니다.
  v_path := 'pv/' || v_pv || '/' || v_kind || '/' ||
            gen_random_uuid()::text || '.' || v_ext;

  insert into provider_photo (provider_id, kind, path, mime, bytes, caption, by_user)
  values (v_pv, v_kind, v_path, v_mime, v_bytes, v_cap, v_uid)
  returning id into v_id;

  insert into audit_log (by_user, by_role, obj, obj_id, to_state, data)
  values (v_uid, my_role(), 'provider_photo', v_id::text, v_kind,
          jsonb_build_object('mime', v_mime, 'bytes', v_bytes));

  return jsonb_build_object('id', v_id, 'path', v_path, 'kind', v_kind);
end $$;
revoke all on function claim_provider_photo(jsonb) from public;
grant execute on function claim_provider_photo(jsonb) to authenticated;

-- ════════════════════════════════════════════════════════════════════
-- ⑤ 문 — 뺍니다
--   ⚠️ 파일은 Storage 에 남습니다 (줄만 지웁니다) — 서버가 이어서
--   지우고, 못 지워도 보기에 안 나오므로 화면에는 안 보입니다.
-- ════════════════════════════════════════════════════════════════════
create or replace function drop_provider_photo(p jsonb)
returns text
language plpgsql security definer set search_path = public as $$
declare
  v_uid  uuid := auth.uid();
  v_id   uuid := nullif(btrim(coalesce(p->>'id','')), '')::uuid;
  v_pv   text;
  v_kind text;
  v_path text;
begin
  if v_uid is null then raise exception '로그인이 필요합니다'; end if;
  if v_id is null then raise exception '어느 파일인지 알 수 없습니다'; end if;
  select provider_id, kind, path into v_pv, v_kind, v_path
    from provider_photo where id = v_id;
  if v_pv is null then raise exception '그런 파일이 없습니다'; end if;
  -- ⚠️⚠️ 그 업체의 담당자 **또는** 운영자입니다
  if not (coalesce(my_provider() = v_pv, false)
          or coalesce(my_role() in ('staff','admin'), false)) then
    raise exception '이 파일을 뺄 권한이 없습니다';
  end if;

  delete from provider_photo where id = v_id;

  -- ⚠️ 감사 기록에 **경로를 넣지 않습니다** — 번호로 찾아갑니다
  insert into audit_log (by_user, by_role, obj, obj_id, to_state, data)
  values (v_uid, my_role(), 'provider_photo', v_id::text, 'dropped',
          jsonb_build_object('kind', v_kind));
  -- ⚠️ 서버가 이어서 Storage 에서 지웁니다 (경로를 돌려줍니다)
  return v_path;
end $$;
revoke all on function drop_provider_photo(jsonb) from public;
grant execute on function drop_provider_photo(jsonb) to authenticated;

insert into schema_version (n, name) values (51, '0051_provider_photo')
  on conflict (n) do nothing;

commit;
