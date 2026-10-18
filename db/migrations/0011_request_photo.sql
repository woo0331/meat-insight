-- ════════════════════════════════════════════════════════════════════
-- 0011 — 신청에 붙는 사진 · 서류
--        2026-10-18 "매장 운영 전문관 2차" §7-3 · §15
--
-- ⚠️⚠️ **왜 이 파일이 생겼나 — 올릴 데가 없었습니다.**
--   §7-3 은 "사진 첨부" 를 적었는데 받아 둘 저장소가 없어서, 지금까지는
--   **사진 주소를 적는 칸**으로 대신했습니다 (링크를 가진 분만 쓸 수
--   있는 길입니다). 냉장고가 어떻게 고장났는지 · 어느 벽을 뜯는지는
--   글로 적기 어려워서, 업체가 그것 없이 낸 금액은 현장에서 또 바뀝니다.
--
-- ⚠️⚠️ **사진은 접수한 뒤에 올립니다.** 접수 전에 올리게 하면
--   **아무나 올리는 길**이 하나 생깁니다 (로그인 없이 들어오는
--   접수라 변경자를 모릅니다) — §15 가 "악용 방어" 를 적은 자리입니다.
--   지금 길은 이렇습니다 —
--
--     ① 접수한다            → 접수번호(SW-XXXX-XXXX)를 받습니다
--     ② 번호 + 연락처로 확인 → 자리 하나를 내줍니다 (아래 문)
--     ③ 그 자리에만 올린다   → 버킷의 정해진 경로 하나
--
--   그래서 사진을 올리려면 **먼저 실제 접수가 있어야** 하고, 접수는
--   이미 중복 · 스팸 판정을 거칩니다 (`api/_intake.js`).
--
-- ⚠️⚠️ **파일 자체는 여기 안 들어옵니다.** Postgres 에 바이트를 담으면
--   덤프가 몇 기가가 되고, 이 저장소는 덤프를 다루지 않는 것이 규칙
--   입니다. 담는 것은 **버킷 안의 경로**까지입니다.
--
-- ⚠️⚠️ **버킷은 비공개라야 합니다.** 올리신 사진은 사장님 것이고,
--   공개 버킷이면 경로를 아는 누구나 봅니다. 보는 길은 아래 RLS 를
--   거치는 `/api/upload` 하나입니다 (서명된 주소를 그때그때 만듭니다).
-- ⚠️⚠️ **버킷을 만드실 때 크기 상한과 허용 형식을 거기서도 걸어
--   주세요.** 서명된 올리기 주소는 그 자체로 크기와 형식을 막지
--   않습니다 — 여기서 받는 값은 "적어 보낸 값" 이고, 실제로 막는 것은
--   **버킷 설정**입니다 (db/README.md 에 적어 두었습니다).
--
--     ① request_photo      신청에 붙는 사진 한 줄 (경로 · 형식 · 크기)
--     ② claim_photo_slot   번호 + 연락처로 자리 하나 (service key 전용)
--     ③ drop_photo         올리신 분 · 직원 · 관리자가 뺍니다
--
-- ⚠️ 두 번 돌려도 안전합니다 (if not exists · create or replace).
-- ════════════════════════════════════════════════════════════════════

begin;

-- ════════════════════════════════════════════════════════════════════
-- ① 신청에 붙는 사진
--
-- ⚠️ `path` 가 유일합니다 — 같은 경로를 두 줄로 두면 하나를 빼도
--   다른 줄이 남아 지워진 파일을 가리킵니다.
-- ⚠️⚠️ **원래 파일 이름을 담지 않습니다.** 손님이 올리시는 파일 이름에
--   성함 · 가게 이름이 들어 있는 경우가 흔합니다 ("김사장_주방.jpg") —
--   담으면 그게 또 하나의 개인정보 사본입니다. 담는 것은 경로 ·
--   형식 · 크기까지입니다 (최소 수집).
create table if not exists request_photo (
  id          uuid primary key default gen_random_uuid(),
  request_id  uuid not null references request(id) on delete cascade,
  -- 버킷 안의 경로 (파일 자체는 Supabase Storage 에 있습니다)
  path        text not null unique,
  mime        text not null,
  bytes       bigint not null,
  created_at  timestamptz not null default now(),
  constraint photo_path_ok check (path <> '' and length(path) <= 300),
  -- ⚠️⚠️ 받는 형식을 **DB 가** 정합니다. 화면과 서버가 먼저 거르지만,
  --   둘 다 지나간 뒤 마지막으로 여기서 막습니다 (자물쇠 셋).
  constraint photo_mime_ok check (mime in
    ('image/jpeg','image/png','image/webp','application/pdf')),
  -- ⚠️ 8MB. 폰으로 찍은 사진이 보통 2~5MB 입니다.
  constraint photo_bytes_ok check (bytes > 0 and bytes <= 8388608)
);
create index if not exists photo_req_idx on request_photo (request_id);

alter table request_photo enable row level security;

-- 볼 수 있는 사람은 **그 신청을 볼 수 있는 사람**과 같습니다.
-- ⚠️⚠️ 정책 안에서 `request` 를 바로 읽으면 무한 재귀입니다 — 0005 ·
--   0009 에서 겪은 자리라 security definer 함수로 끊습니다.
drop policy if exists photo_mine on request_photo;
create policy photo_mine on request_photo for select
  using (is_my_request(request_id));

drop policy if exists photo_staff on request_photo;
create policy photo_staff on request_photo for select
  using (my_role() in ('staff','admin'));

-- ⚠️⚠️ **업체는 배정된 건의 사진만 봅니다** (제17조). 배정되지 않은
--   건의 사진이 보이면, 그건 남의 가게 내부 사진입니다.
drop policy if exists photo_provider on request_photo;
create policy photo_provider on request_photo for select
  using (my_provider() is not null and exists (
    select 1 from assignment a
     where a.request_id = request_photo.request_id
       and a.provider_id = my_provider()));

-- ⚠️⚠️ **읽기만 줍니다.** 쓰기를 주면 기록 없이 지나가는 길이 하나
--   생깁니다 (§8) — 아래 문 둘로만 바뀝니다.
grant select on request_photo to authenticated;


-- ════════════════════════════════════════════════════════════════════
-- ② 번호 + 연락처로 자리 하나
--
-- ⚠️⚠️ **번호만으로는 안 됩니다.** 번호를 손에 넣은 사람이 남의 신청에
--   사진을 꽂아 넣을 수 있습니다 — `claim_request` 와 **같은 규칙**이고,
--   **틀린 까닭을 갈라서 말하지 않습니다** (갈라 주면 번호가 있는지를
--   확인해 가며 긁을 수 있습니다).
-- ⚠️⚠️ **service key 로만 부릅니다.** 올리시는 분은 로그인하지 않은
--   상태라 `auth.uid()` 가 비어 있습니다 — 그래서 `authenticated` 에게
--   권한을 주지 않습니다 (주면 로그인한 누구나 남의 신청에 꽂습니다).
-- ⚠️ 경로를 **여기서** 만듭니다. 화면이 보낸 이름을 쓰면 `../` 같은
--   것이 섞여 들어오고, 원래 파일 이름에는 성함이 들어 있기도 합니다.
create or replace function claim_photo_slot(
    p_no text, p_tel text, p_mime text, p_bytes bigint)
  returns jsonb
  language plpgsql security definer set search_path = public as $$
declare
  r      record;
  n      int;
  ext    text;
  newp   text;
begin
  if p_no is null or p_tel is null then
    raise exception '신청번호와 연락처를 확인해 주세요';
  end if;
  -- ⚠️ 숫자만 남겨 견줍니다 (031-000-0000 과 0310000000 은 같은 번호)
  select * into r from request
   where no = upper(btrim(p_no))
     and regexp_replace(coalesce(tel,''), '[^0-9]', '', 'g')
       = regexp_replace(p_tel, '[^0-9]', '', 'g');
  -- ⚠️⚠️ **한 가지 말로만 거절합니다** (claim_request 와 같은 규칙)
  if not found then
    raise exception '신청번호와 연락처를 확인해 주세요';
  end if;

  -- ⚠️ 다섯까지입니다. 상한이 없으면 접수 하나로 버킷을 채웁니다 (§15).
  select count(*) into n from request_photo where request_id = r.id;
  if n >= 5 then
    raise exception '사진은 다섯 장까지 올리실 수 있습니다';
  end if;

  ext := case p_mime
           when 'image/jpeg' then 'jpg'
           when 'image/png'  then 'png'
           when 'image/webp' then 'webp'
           when 'application/pdf' then 'pdf'
           else null end;
  if ext is null then
    raise exception '사진은 JPG · PNG · WEBP, 서류는 PDF 만 올리실 수 있습니다';
  end if;
  if p_bytes is null or p_bytes <= 0 or p_bytes > 8388608 then
    raise exception '한 장에 8MB 까지 올리실 수 있습니다';
  end if;

  -- ⚠️⚠️ 경로에 **번호 · 연락처를 넣지 않습니다.** 경로가 새면 그
  --   글자도 같이 새고, 버킷 목록에 그대로 보입니다.
  -- ⚠️⚠️ **`gen_random_bytes()` 를 쓰지 마세요** — pgcrypto 확장에만
  --   있습니다. Supabase 가 그걸 켜 두는 것에 **조용히 기대면** 확장을
  --   끄거나 다른 Postgres 에 세우는 날 이 함수가 통째로 터집니다
  --   (0001 이 GRANT 를 Supabase 기본값에 기대고 있었던 그 자리).
  --   `gen_random_uuid()` 는 **Postgres 13 부터 기본**입니다.
  newp := 'req/' || r.id::text || '/' ||
          replace(gen_random_uuid()::text, '-', '') || '.' || ext;

  insert into request_photo (request_id, path, mime, bytes)
  values (r.id, newp, p_mime, p_bytes);

  -- §8 — 신청 내용이 바뀌는 일이라 기록을 남깁니다 (한 트랜잭션).
  -- ⚠️ 번호 · 연락처 · 경로를 기록에 싣지 않습니다 — 형식과 크기까지.
  insert into audit_log (by_role, obj, obj_id, why, data)
  values ('customer', 'request', r.id::text, '사진을 올렸습니다',
          jsonb_build_object('mime', p_mime, 'bytes', p_bytes, 'n', n + 1));

  return jsonb_build_object('path', newp, 'request', r.id);
end $$;
revoke all on function claim_photo_slot(text, text, text, bigint) from public;


-- ════════════════════════════════════════════════════════════════════
-- ③ 빼기
--
-- ⚠️ 잘못 올리신 사진을 뺄 길이 없으면, 그 사진은 영영 남습니다.
-- ⚠️⚠️ **파일은 서버가 지웁니다.** 이 문은 줄만 지웁니다 — 둘을 한
--   트랜잭션에 묶을 수가 없어서(버킷은 다른 서비스입니다), 줄을 먼저
--   지우고 파일을 그 다음에 지웁니다. 거꾸로 하면 파일은 없는데 줄이
--   남아 **안 열리는 사진**이 보입니다.
create or replace function drop_photo(p_photo uuid) returns void
  language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  rol app_role := my_role();
  p   record;
begin
  if uid is null then
    raise exception '로그인이 필요합니다';
  end if;
  select * into p from request_photo where id = p_photo;
  if not found then raise exception '사진을 찾을 수 없습니다'; end if;
  -- ⚠️⚠️ 올리신 분(계정에 이어 둔 경우) · 직원 · 관리자까지입니다.
  --   **업체는 뺄 수 없습니다** — 남이 올린 자료를 지우는 일입니다.
  if not (is_my_request(p.request_id) or rol in ('staff','admin')) then
    raise exception '이 사진을 뺄 권한이 없습니다';
  end if;

  delete from request_photo where id = p_photo;

  insert into audit_log (by_user, by_role, obj, obj_id, why, data)
  values (uid, rol, 'request', p.request_id::text, '사진을 뺐습니다',
          jsonb_build_object('mime', p.mime, 'bytes', p.bytes));
end $$;
revoke all on function drop_photo(uuid) from public;
grant execute on function drop_photo(uuid) to authenticated;


-- 판 번호 (db/README.md) — ⚠️ 칸 이름은 0002 의 것입니다 (n · name)
insert into schema_version (n, name) values (11, '0011_request_photo')
on conflict (n) do nothing;

commit;
