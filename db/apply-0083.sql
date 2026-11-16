/* ==================================================================
   0083 ~ 0083 를 한 번에 —
   Supabase SQL 편집기에 **이 파일을 통째로** 붙여 넣고 Run 하세요.
   ==================================================================
   WARN 빌드가 만드는 파일입니다 — 손으로 고치지 마세요.
   db/migrations 의 1개를 번호 차례로 이어 붙인 것이고
   한 글자도 바꾸지 않았습니다. (node tools/make-apply.js)

   조각 파일입니다 — 바로 앞 조각까지 끝낸 DB 에만 쓰세요.
   어디까지 됐는지는 db/resume.sql 이 말해 줍니다
   (select max(n) from schema_version).

   돌린 뒤에는 db/verify.sql 을 붙여 넣어 보세요. 중간에서 멈추면 그
   파일 하나만 따로 돌리고 그 다음부터 이어 가시면 됩니다 — 번호를
   다시 쓰지 않습니다.

   WARN 통째로 begin/commit 으로 감싸지 마세요 — 파일마다 제
   트랜잭션이 있고 0015 는 일부러 감싸지 않았습니다. */

/* ---------------------------- 0083_request_contact_lock.sql ---------------------------- */
-- 0083 — 요청의 연락처 칸을 표에서 거둡니다 (2026-11-16 · 비교견적 마무리)
-- ════════════════════════════════════════════════════════════════════
-- ⚠️⚠️⚠️ **차례가 중요합니다 — 0082 → 스위치 켠 화면 배포 → 이 파일.**
--   이 파일을 올리면 `authenticated` 가 `request` 에서 name · tel · email ·
--   tel_key 를 **못 읽습니다**. 스위치(compareOn)가 꺼진 화면은 그 칸을 표에서
--   묻기 때문에, 켠 화면이 운영에 나가기 **전에** 올리면 업체 작업실 · 운영자
--   배정이 빈 채로 남습니다. 켠 화면은 `v_request_contact`(0082)로 읽습니다.
--
-- 왜 — 0001 은 `request` 의 select 를 **표째로** 주었고 RLS 는 줄만 좁힙니다.
--   그래서 배정된 업체는 수락 전에도 그 줄의 성함 · 연락처를 **화면이 가려도
--   API 로** 읽을 수 있었고, 비교견적(연락처를 안 넘기는 배정)에서는 그 길이
--   그대로 연락처를 흘립니다. 0082 의 `assign_more` 는 이 파일이 올라가기 전에는
--   비교 배정을 거절합니다.
--
-- 기존 회원 · 자료 — **한 줄도 안 바뀝니다**(권한만 좁힙니다). 손님은 제 요청의
--   연락처를 보기로 그대로 읽고, 운영자 · 직원도 그렇습니다. 한 업체 흐름의 업체는
--   **수락한 뒤에** 읽습니다(화면은 전에도 수락 뒤에만 보여 줬습니다).
--
-- 되돌리기 — 맨 아래 주석 한 줄(표 단위 select 복원). ⚠️ 스위치를 끈 화면으로
--   되돌릴 때는 **이 되돌리기를 먼저** 해야 그 화면이 다시 읽힙니다.
-- ════════════════════════════════════════════════════════════════════
begin;

-- ⚠️ 칸 목록을 글자로 박지 않습니다 — 지금 있는 칸에서 넷을 빼고 줍니다
--   (칸이 늘어난 날 그 칸만 빠지는 일이 없게).
revoke select on request from authenticated;
do $$
declare v_cols text;
begin
  select string_agg(quote_ident(column_name), ', ' order by ordinal_position)
    into v_cols
    from information_schema.columns
   where table_schema = 'public' and table_name = 'request'
     and column_name not in ('name','tel','email','tel_key');
  execute format('grant select (%s) on request to authenticated', v_cols);
end $$;

-- ⚠️ 막혔는지 그 자리에서 확인합니다 — 안 막혔으면 통째로 되돌아갑니다
do $$ begin
  if has_column_privilege('authenticated', 'public.request', 'tel', 'select') then
    raise exception '연락처 칸이 아직 열려 있습니다 — 0083 을 멈춥니다';
  end if;
  if not has_column_privilege('authenticated', 'public.request', 'state', 'select') then
    raise exception '연락처 아닌 칸까지 막혔습니다 — 0083 을 멈춥니다';
  end if;
end $$;

insert into schema_version (n, name) values (83, '0083_request_contact_lock')
on conflict (n) do nothing;
commit;

-- ── 되돌리기 ──────────────────────────────────────────────────────────
-- begin;
--   grant select on request to authenticated;
--   delete from schema_version where n = 83;
-- commit;
