-- ════════════════════════════════════════════════════════════════════
-- 0081 — 골프장 마스터에 **사진 한 장** (확정 시안 ① 의 티타임 카드)
--
-- ⚠️⚠️⚠️ **아직 운영에 올리지 않았습니다.** 0080 과 같습니다 — 연결
--   대상(어느 Supabase 프로젝트인가)이 확정되고, survey 로 기존 구조 ·
--   권한 · 트리거 · 부분 적용을 확인한 뒤에 범위를 정해 올립니다.
--
-- 무엇을 더하나 — **칸 하나**입니다. 지우거나 이름을 바꾸는 줄이 한
-- 줄도 없습니다.
--   · course.photo        골프장 대표 사진의 **경로** (비울 수 있습니다)
--   · v_teetime_open.photo  그 티타임이 이어진 마스터의 사진 (없으면 null)
--
-- ⚠️⚠️⚠️ **이것은 「제휴가 필요한 값」이 아닙니다.** 0066 이 칸을 아예
--   안 만든 것은 **실시간 잔여 티타임 · 그린피 · 회원권 호가 · 상품
--   재고** 입니다 — 우리가 **확인할 수 없는 사실**이라 칸을 만들면
--   누군가 지어내서 채웁니다. 사진은 다릅니다: **운영자가 권리를 확인하고
--   올리는 자산**이고, 비어 있으면 화면이 **아이콘 타일**로 돌아갑니다
--   (0051 의 업체 시설 사진과 같은 규칙).
--
-- ⚠️⚠️ **업체 사진을 골프장 사진 자리에 쓰지 않습니다.** 「(예시) 수도권
--   부킹센터」의 사무실 사진을 「그린밸리CC」 카드에 깔면 손님은 그것을
--   **그 골프장 사진**으로 읽습니다(표시 · 광고의 공정화에 관한 법률
--   제3조). 그래서 사진은 **골프장 마스터**(`course`)에 답니다 — 이름이
--   붙은 그 골프장의 사진입니다.
--
-- ⚠️⚠️ **아직 없는 것 — 올리는 자리.** 이 번호는 **담는 칸과 내보내는
--   길**까지입니다. 운영자가 파일을 올리는 화면(`api/upload.js` 의
--   `course` 가지 + `claim_course_photo` 문)은 **다음 번호**입니다.
--   지금은 `/admin` 의 골프장 양식에서 **경로를 적는 칸**이 있습니다 —
--   공개 버킷에 이미 올라간 파일을 가리키는 자리입니다.
--   ⚠️ 그래서 이 줄을 적어 둡니다: **「만들어 놓고 안 쓰는 칸」이 되지
--   않게**, 올리는 자리를 내는 날 이 머리말을 같이 고치세요.
--
-- 되돌아갔는지 보는 법 —
--   select column_name from information_schema.columns
--    where table_name = 'course' and column_name = 'photo';
--   select column_name from information_schema.columns
--    where table_name = 'v_teetime_open' and column_name = 'photo';
-- ════════════════════════════════════════════════════════════════════

-- ── ① 칸 ────────────────────────────────────────────────────────────
-- ⚠️ 비울 수 있습니다(null). 이미 들어와 있는 골프장 수천 곳은 전부
--    null 이 되고, 그 줄들은 화면에서 **아이콘 타일**로 그려집니다.
alter table course add column if not exists photo text;

-- ⚠️⚠️ **경로 꼴을 DB 가 다시 봅니다** — 화면에서만 막으면 꾸러미를
--    고쳐 지나갑니다(0051 · 0068 에서 세운 규칙). 공개 버킷의
--    `course/<uuid>/...` 아래만 가리킬 수 있습니다.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'course_photo_ck') then
    alter table course add constraint course_photo_ck
      check (photo is null or
             (photo ~ '^course/[0-9a-f-]{36}/[A-Za-z0-9._-]{1,80}$'
              and position('..' in photo) = 0));
  end if;
end $$;

-- ── ② 운영자가 적는 길 (0066 의 문을 덮습니다) ──────────────────────
-- ⚠️⚠️ **보낸 것으로 통째로 덮는 문이 아닙니다** — 0066 은 보낸 칸만
--    고칩니다. 그래서 `p ? 'photo'` 로 **보냈는지**를 보고 갈립니다:
--    안 보내면 그대로 두고, 빈 글자를 보내면 **지웁니다**(0069 의
--    모델명과 같은 결 — `coalesce` 로 받으면 지울 수가 없습니다).
create or replace function save_course_photo(p jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare v_role app_role := my_role(); v_id uuid; v_photo text; v_n int;
begin
  if coalesce(v_role::text,'') not in ('staff','admin') then
    raise exception '골프장 사진은 운영자만 고칠 수 있습니다';
  end if;
  v_id := nullif(p->>'id','')::uuid;
  if v_id is null then raise exception '어느 골프장인지 알려 주세요'; end if;
  if not (p ? 'photo') then raise exception '사진 경로를 보내 주세요'; end if;

  v_photo := nullif(btrim(coalesce(p->>'photo','')), '');
  update course set photo = v_photo, updated_at = now() where id = v_id;
  get diagnostics v_n = row_count;
  -- ⚠️ 0줄이면 **거절합니다** — 조용히 끝내면 기록에 "바꿨다" 가 남는데
  --    아무 일도 안 일어난 것입니다(0054 의 그 자리).
  if v_n = 0 then raise exception '그 골프장을 찾을 수 없습니다'; end if;

  insert into audit_log (by_user, what, obj, note)
  values (auth.uid(), 'save_course_photo', v_id::text,
          case when v_photo is null then '사진을 뺐습니다' else '사진을 적었습니다' end);
end $$;
revoke all on function save_course_photo(jsonb) from public;
grant execute on function save_course_photo(jsonb) to authenticated;

-- ── ③ 공개 보기 (0060 → 0066 → **0081**) ───────────────────────────
-- ⚠️⚠️⚠️ **`drop view` 를 쓰지 않습니다** — `v_teetime_count` 가 이 보기
--    위에 서 있어서 지우려 하면 `cannot drop view … because other objects
--    depend on it` 으로 멈춥니다(0060 이 밟은 그 자리). `create or
--    replace` 는 **칸을 맨 뒤에 더하는 것**은 됩니다.
-- ⚠️⚠️ **0066 의 정의를 그대로 베끼고 한 칸만 더합니다** — 0066 이
--    "기억으로 다시 썼다가 셋을 빠뜨렸다" 고 적어 둔 자리입니다.
create or replace view v_teetime_open as
  select t.id, t.provider_id, p.name as provider_name,
         t.kind, t.region, t.course, t.play_at, t.tee_at, t.holes,
         t.slots, t.green_fee,
         coalesce(nullif(btrim(coalesce(t.tel, '')), ''), p.tel) as tel,
         t.note, t.created_at,
         t.slots - (select coalesce(sum(b.people), 0) from teebook b
                     where b.tee_id = t.id
                       and b.state in ('applied','confirmed')) as left_n,
         (select count(*) from teebook b
           where b.tee_id = t.id and b.state = 'confirmed') as confirmed_n,
         t.course_id,
         (select c.slug from course c
           where c.id = t.course_id and c.state <> 'hidden') as course_slug,
         -- ── 0081 이 더한 하나 ────────────────────────────────
         -- ⚠️ 가려진 골프장의 사진은 **안 냅니다**(slug 와 같은 조건입니다)
         (select c.photo from course c
           where c.id = t.course_id and c.state <> 'hidden') as photo
    from teetime t
    join provider p on p.id = t.provider_id
   where t.state = 'open'
     and t.play_at >= kst_today()
     and p.listed = true
     and p.is_test = false
     and p.state = 'approved';
grant select on v_teetime_open to anon, authenticated;

-- ── ④ 골프장 공개 보기 (0066 → **0081**) ───────────────────────────
-- ⚠️⚠️ `v_course_count` 가 이 보기 위에 서 있으므로 여기서도 `drop view`
--    를 쓰지 않습니다 — `create or replace` 로 **맨 뒤에** 한 칸만 더합니다.
-- ⚠️ 사진은 **공개 자산**입니다(공개 버킷 · 주소만 알면 누구나 엽니다) —
--    그래서 공개 보기에 있는 것이 맞습니다. 운영자 화면이 지금 값을
--    미리 채우려면 읽을 길이 있어야 합니다(없으면 저장할 때마다 빈 칸을
--    보게 되고, 그건 「만들어 놓고 안 쓰는 칸」입니다).
create or replace view v_course_public as
  select c.id, c.slug, c.kind, c.name, c.region, c.gu,
         c.addr, c.addr_road, c.tel, c.holes, c.biz_kind, c.site_url,
         c.lat, c.lng, c.state, c.updated_at,
         (select s.source_id from course_source s
           where s.course_id = c.id order by s.created_at limit 1) as source_id,
         (select max(s.as_of) from course_source s where s.course_id = c.id) as as_of,
         -- ── 0081 이 더한 하나 ────────────────────────────────
         c.photo
    from course c
   where c.state <> 'hidden';
grant select on v_course_public to anon, authenticated;
