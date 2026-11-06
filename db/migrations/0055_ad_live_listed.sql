-- ════════════════════════════════════════════════════════════════════
-- 0055 — 광고 보기가 **정지된 업체를 걸러내게** 합니다
-- ════════════════════════════════════════════════════════════════════
-- ⚠️⚠️⚠️ **0026 · 0032 의 `v_ad_live` 는 `is_test = false` 만 봤습니다.**
--   그래서 업체를 **정지시켜도**(0038 의 `set_provider_state`) 그 업체의
--   광고는 손님 화면에 그대로 나갔습니다. 작업 기억에 "정지는 셋을
--   동시에 막습니다 — 공개 목록 · 새 배정 · 새 견적" 이라고 적혀 있는데,
--   **광고가 넷째 자리**였고 아무도 그 줄을 세지 않았습니다.
--   ⚠️ 더 나쁜 것은 **아직 승인 안 된 업체**(`draft` · `submitted` ·
--   `under_review` · `rejected`)도 통과했다는 것입니다. 그 업체는
--   `/pro/<id>` 화면이 **빌드에 없어서** 광고를 눌러도 404 입니다.
--
-- ⚠️⚠️ **보기는 RLS 를 지나지 않습니다** — 임자 권한으로 돕니다. 그래서
--   이 `where` 절이 **자물쇠 그 자체**입니다 (0030 의 정책은 이 길을 못
--   막습니다 — 0032 가 검사용 업체를 걸러낸 그 자리와 같은 결입니다).
--
-- ⚠️ 조건은 공개 카드 보기(`v_provider_card` · 0044)와 **같은 셋**입니다 —
--   "손님에게 보이는 업체" 의 뜻이 두 곳에서 달라지지 않게.
--       listed = true  ·  is_test = false  ·  state = 'approved'
--
-- ⚠️ 칸은 **하나도 안 바꿉니다** (더하지도 빼지도 않습니다) — 그래서
--   `create or replace` 로 됩니다. 칸을 늘리려면 drop + create 여야
--   하고, 그때는 GRANT 를 바로 다시 줘야 합니다 (0044 에서 겪었습니다).
--
-- 되돌아갔는지 보는 법
--   select pg_get_viewdef('v_ad_live'::regclass) ilike '%listed%';  -- t 여야 합니다
--   ⚠️⚠️ 0026 이나 0032 **파일만 따로 다시 붙여 넣으면 이 좁힘이 조용히
--   풀립니다** (0053 의 칸 GRANT 와 같은 꼴). 붙여넣기 파일을 통째로
--   쓰시면 0055 가 뒤에 와서 다시 좁힙니다.
-- ════════════════════════════════════════════════════════════════════
begin;

create or replace view v_ad_live as
  select a.id, a.provider_id, p.name as provider_name,
         a.place, a.cat_key, a.region, a.starts_on, a.ends_on,
         '광고'::text as label
    from ad_run a join provider p on p.id = a.provider_id
   where a.state = 'live'
     and current_date between a.starts_on and a.ends_on
     and p.is_test = false
     -- ⚠️ 여기가 0055 가 더한 줄입니다 (위 머리말)
     and p.listed = true
     and p.state = 'approved';

-- ⚠️ `create or replace` 는 권한을 지키지만, 다시 주는 것은 공짜이고
--   혹시 앞 번호가 drop 으로 바뀌는 날의 보험입니다.
grant select on v_ad_live to anon, authenticated;

insert into schema_version (n, name) values (55, '0055_ad_live_listed')
  on conflict (n) do nothing;

commit;
