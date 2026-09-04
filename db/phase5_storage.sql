-- ════════════════════════════════════════════════════════════════════
--  고리 — PHASE 5 : 업체 사진 저장소 (Supabase Storage)
--
--  ⚠️ 추가 전용. 기존 데이터·테이블 변경 없음. 재실행 안전.
--     phase2 → phase3 → phase4 를 먼저 실행하세요.
-- ════════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────
-- 1. 버킷 생성 (공개 읽기)
--    업체 사진은 목록·상세에서 누구나 봐야 하므로 public 입니다.
--    SQL 이 권한 문제로 막히면 대시보드에서 만들어도 됩니다:
--    Storage → New bucket → 이름 supplier-photos → Public bucket 체크
-- ────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('supplier-photos','supplier-photos', true, 5242880,
        array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
  set public = true,
      file_size_limit = 5242880,
      allowed_mime_types = array['image/jpeg','image/png','image/webp'];

-- ────────────────────────────────────────────────────────────
-- 2. 접근 정책
--    읽기: 전체 공개 / 업로드: 로그인 사용자 / 삭제: 올린 본인 또는 관리자
-- ────────────────────────────────────────────────────────────
drop policy if exists "gori supplier photos read"   on storage.objects;
create policy "gori supplier photos read" on storage.objects
  for select using (bucket_id = 'supplier-photos');

drop policy if exists "gori supplier photos upload" on storage.objects;
create policy "gori supplier photos upload" on storage.objects
  for insert with check (
    bucket_id = 'supplier-photos' and auth.role() = 'authenticated'
  );

drop policy if exists "gori supplier photos delete" on storage.objects;
create policy "gori supplier photos delete" on storage.objects
  for delete using (
    bucket_id = 'supplier-photos'
    and (owner = auth.uid() or public.is_gori_admin())
  );

-- ────────────────────────────────────────────────────────────
-- 3. 확인
--    select id, public from storage.buckets where id = 'supplier-photos';
-- ────────────────────────────────────────────────────────────
