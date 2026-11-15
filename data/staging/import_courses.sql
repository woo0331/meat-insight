-- ════════════════════════════════════════════════════════════════
-- 골프장 · 연습장 들여오기 — 2026-11-15T08:26:44.916Z
-- 만든 도구: tools/make-import-sql.js  (손으로 고치지 마세요)
-- 시설 수: 515  (거절 0 · 검토 대기로 안 넣은 것 20 — data/staging/courses_hold.csv)
-- 출처 줄 수: 559
--
-- ⚠️⚠️ **두 번 붙여 넣어도 안전합니다** (on conflict 로 덮습니다).
-- ⚠️⚠️ 되돌리려면 data/staging/rollback_courses.sql 을 쓰세요.
-- ⚠️ 0066 이 먼저 돌아가 있어야 합니다.
-- ════════════════════════════════════════════════════════════════
begin;

-- 이 묶음을 알아보는 표시 — 되돌릴 때 이것으로 찾습니다
create temp table _imp(batch text);
insert into _imp values ('b407c24b4a99c');

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h7056be355a4b', 'golf', '기장동원로얄컨트리클럽', 'busan', '기장군', '부산광역시 기장군 기장읍 반송로 1345-52', null, null, 9, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h7056be355a4b', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hc95f14815c47', 'golf', '동래베네스트골프클럽', 'busan', '금정구', '부산광역시 금정구 하정로 66', null, null, 18, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hc95f14815c47', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h79cd5a34fc7c', 'golf', '베이사이드골프클럽', 'busan', '기장군', '부산광역시 기장군 일광읍 이천8길 100', null, null, 27, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h79cd5a34fc7c', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hdb02605c2b3f', 'golf', '부산컨트리클럽', 'busan', '금정구', '부산광역시 금정구 중앙대로2327번길 11', null, null, 18, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hdb02605c2b3f', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h89f666ff5cc7', 'golf', '스톤게이트컨트리클럽', 'busan', '기장군', '부산광역시 기장군 일광읍 곡천길 317', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h89f666ff5cc7', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h10195e157ff2', 'golf', '아시아드컨트리클럽', 'busan', '기장군', '부산광역시 기장군 일광읍 차양길 26', null, null, 27, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h10195e157ff2', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h6afa2c1a9d6e', 'golf', '하이스트컨트리클럽', 'busan', '강서구', '부산광역시 강서구 과학산단1로 172', null, null, 9, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h6afa2c1a9d6e', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hf9783d4c4899', 'golf', '해라컨트리클럽', 'busan', '강서구', '부산광역시 강서구 과학산단로 306번길 77', null, null, 9, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hf9783d4c4899', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h768efaa65feb', 'golf', '해운대비치골프앤리조트', 'busan', '기장군', '부산광역시 기장군 기장읍 대변로 74', null, null, 18, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h768efaa65feb', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h570f1ba781e6', 'golf', '해운대컨트리클럽', 'busan', '기장군', '부산광역시 기장군 정관면 병산2로 265', null, null, 27, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h570f1ba781e6', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h6a9d05513d1b', 'golf', '감곡CC', 'chungbuk', '음성군', '음성군 감곡면 문촌리 산81-6', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h6a9d05513d1b', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31'),
    ('chungbuk-golf', 'hcffe71c38735', '현황 등재 — 충청북도 골프장 현황 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2026-06-25')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hf727d7e1e6a2', 'golf', '골드나인cc', 'chungbuk', '청주시 청원구', '청주시 청원구 낭성면 산성로 1520-17', null, null, 9, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hf727d7e1e6a2', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31'),
    ('chungbuk-golf', 'h3d38a46e772e', '현황 등재 — 충청북도 골프장 현황 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2026-06-25')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h2c5315fbe94a', 'golf', '골프존카운티 진천cc', 'chungbuk', '진천군', '진천군 진천읍 송강로 783-51', null, null, 27, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h2c5315fbe94a', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h1bcb220c4f7f', 'golf', '골프존카운티 화랑cc', 'chungbuk', '진천군', '진천군 문백면 농다리로 809', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h1bcb220c4f7f', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hd22f5a8a1ab0', 'golf', '그랜드cc', 'chungbuk', '청주시', '청주시 청원군 오창읍 꽃화산길 14', null, null, 27, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hd22f5a8a1ab0', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31'),
    ('chungbuk-golf', 'h432f087150a9', '현황 등재 — 충청북도 골프장 현황 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2026-06-25')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h9f8d7a76154c', 'golf', '대영베이스cc', 'chungbuk', '충주시', '충주시 대소원면 성종두담길 113', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h9f8d7a76154c', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31'),
    ('chungbuk-golf', 'h43a74d9b811e', '현황 등재 — 충청북도 골프장 현황 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2026-06-25')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h2b90b3d21ec5', 'golf', '대영힐스cc', 'chungbuk', '충주시', '충주시 대소원면 성종두담길 114', null, null, 27, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h2b90b3d21ec5', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31'),
    ('chungbuk-golf', 'hc1050d6b9800', '현황 등재 — 충청북도 골프장 현황 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2026-06-25')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h5ab5ab420c66', 'golf', '대호단양cc', 'chungbuk', '단양군', '단양군 매포읍 고양5길 43', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h5ab5ab420c66', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hd6f892872010', 'golf', '동 촌cc', 'chungbuk', '충주시', '충주시 노은면 감노로 1327', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hd6f892872010', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h5e4bf4fff92e', 'golf', '떼제베운영', 'chungbuk', '청주시 흥덕구', '청주시 흥덕구 옥산면 동림2길 149', null, null, 36, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h5e4bf4fff92e', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h2358d84d616d', 'golf', '레인보우힐스', 'chungbuk', '음성군', '음성군 생극면 차생로 168', null, null, 27, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h2358d84d616d', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h7c125cd304cc', 'golf', '로얄포레cc', 'chungbuk', '충주시', '충주시 신니면 화치3길 35', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h7c125cd304cc', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hfb3f1dd18615', 'golf', '모나크cc', 'chungbuk', '음성군', '음성군 금왕읍 대금로 1851번길 3-14', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hfb3f1dd18615', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31'),
    ('chungbuk-golf', 'h61200c685f95', '현황 등재 — 충청북도 골프장 현황 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2026-06-25')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h6074ce301bcb', 'golf', '블랙스톤cc', 'chungbuk', '증평군', '증평군 도안면 벼루재길 334', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h6074ce301bcb', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hd20ace1012bf', 'golf', '세 일cc', 'chungbuk', '충주시', '충주시 신니면 동락길 207', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hd20ace1012bf', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-ha7a5453f2fbf', 'golf', '센테리움cc', 'chungbuk', '충주시', '충주시 노은면 솔고개로 750', null, null, 27, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'ha7a5453f2fbf', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31'),
    ('chungbuk-golf', 'h97d1ccbd8616', '현황 등재 — 충청북도 골프장 현황 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2026-06-25')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hf8913c1e38f4', 'golf', '스 타cc', 'chungbuk', '충주시', '충주시 앙성면 상대촌1길 198', null, null, 18, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hf8913c1e38f4', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31'),
    ('chungbuk-golf', 'h1062535f9bc3', '현황 등재 — 충청북도 골프장 현황 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2026-06-25')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h71be095d6336', 'golf', '시그너스cc', 'chungbuk', '충주시', '충주시 앙성면 중방곡길 57-44', null, null, 27, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h71be095d6336', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31'),
    ('chungbuk-golf', 'he34bd58916f2', '현황 등재 — 충청북도 골프장 현황 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2026-06-25'),
    ('mcst-golf-nationwide', 'hf8c7f4c7b55f', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h87d99b44863d', 'golf', '썬밸리cc', 'chungbuk', '음성군', '음성군 삼성면 법말길 49', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h87d99b44863d', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hfd717557459c', 'golf', '아난티 중앙골프클럽', 'chungbuk', '진천군', '진천군 백곡면 배티로 818-105', null, null, 27, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hfd717557459c', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31'),
    ('chungbuk-golf', 'h5393827eac1c', '현황 등재 — 충청북도 골프장 현황 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2026-06-25')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hb3f59560c35f', 'golf', '에콜리안제천', 'chungbuk', '제천시', '제천시 고암동 송학 주천로 102', null, null, 9, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hb3f59560c35f', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h06b2679d9ae5', 'golf', '오창 에딘버러', 'chungbuk', '청주시 청원구', '청주시 청원구 오창읍 두릉유리로 846', null, null, 9, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h06b2679d9ae5', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h4b960b58accf', 'golf', '올데이 골프앤리조트', 'chungbuk', '충주시', '충주시 앙성면 비내길 189', null, null, 27, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h4b960b58accf', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31'),
    ('chungbuk-golf', 'h8cdbf5d83b5e', '현황 등재 — 충청북도 골프장 현황 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2026-06-25')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h116d19bab2e9', 'golf', '음성 힐데스하임cc', 'chungbuk', '음성군', '음성군 소이면 후미리 산40-4', null, null, 27, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h116d19bab2e9', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31'),
    ('chungbuk-golf', 'h177c9765d333', '현황 등재 — 충청북도 골프장 현황 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2026-06-25')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h199b5cb27eaa', 'golf', '이븐데일cc', 'chungbuk', '청주시 상당구', '청주시 상당구 미원면 대신2길 31', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h199b5cb27eaa', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31'),
    ('chungbuk-golf', 'h0714bdca6833', '현황 등재 — 충청북도 골프장 현황 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2026-06-25')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h167c958358ca', 'golf', '일라이트 컨트리클럽', 'chungbuk', '영동군', '영동군 영동읍 매천리 산 35-1', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h167c958358ca', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31'),
    ('chungbuk-golf', 'he4426e08905c', '현황 등재 — 충청북도 골프장 현황 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2026-06-25')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-haeb6b27f098e', 'golf', '일레븐cc', 'chungbuk', '충주시', '충주시 앙성면 본평리 산 43-1', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'haeb6b27f098e', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31'),
    ('chungbuk-golf', 'h1bf7a0db8a79', '현황 등재 — 충청북도 골프장 현황 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2026-06-25')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h8d2012adaea5', 'golf', '임페리얼레이크', 'chungbuk', '충주시', '충주시 금가면 다래울길 52', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h8d2012adaea5', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31'),
    ('chungbuk-golf', 'h98e687615cc5', '현황 등재 — 충청북도 골프장 현황 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2026-06-25')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-he2e8d871b82e', 'golf', '젠스필드cc', 'chungbuk', '음성군', '음성군 삼성면 덕호로 382', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'he2e8d871b82e', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31'),
    ('chungbuk-golf', 'h951b9cd6dcfb', '현황 등재 — 충청북도 골프장 현황 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2026-06-25')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h61b27b24db90', 'golf', '중 원cc', 'chungbuk', '충주시', '충주시 산척면 인등로 392', null, null, 27, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h61b27b24db90', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hf6ab9182dd5d', 'golf', '진양밸리cc', 'chungbuk', '음성군', '음성군 삼성면 금일로 1195', null, null, 27, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hf6ab9182dd5d', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31'),
    ('chungbuk-golf', 'h1db2559e278d', '현황 등재 — 충청북도 골프장 현황 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2026-06-25')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h3c9b391e44bc', 'golf', '코스카cc', 'chungbuk', '음성군', '음성군 음성읍 동음로 318', null, null, 27, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h3c9b391e44bc', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31'),
    ('chungbuk-golf', 'h00f7328f5c55', '현황 등재 — 충청북도 골프장 현황 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2026-06-25')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h74d0525073b0', 'golf', '클럽디보은', 'chungbuk', '보은군', '보은군 보은읍 장속중초로 386', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h74d0525073b0', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hd7d35c24d567', 'golf', '클럽디속리산', 'chungbuk', '보은군', '보은군 탄부면 평각상장로 230', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hd7d35c24d567', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hdb42a280c010', 'golf', '킹스데일cc', 'chungbuk', '충주시', '충주시 주덕면 기업도시3로 2', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hdb42a280c010', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31'),
    ('chungbuk-golf', 'h9b62cf77b365', '현황 등재 — 충청북도 골프장 현황 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2026-06-25')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h0430b5cc16af', 'golf', '킹즈락cc', 'chungbuk', '제천시', '제천시 천남동 내토로7길 136', null, null, 27, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h0430b5cc16af', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31'),
    ('chungbuk-golf', 'h4ec321590803', '현황 등재 — 충청북도 골프장 현황 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2026-06-25')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hb911f0667771', 'golf', '히든밸리cc', 'chungbuk', '진천군', '진천군 백곡면 소토골길 61', null, null, 27, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hb911f0667771', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31'),
    ('chungbuk-golf', 'h35b5e535b514', '현황 등재 — 충청북도 골프장 현황 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2026-06-25')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h8bdf33c0744e', 'golf', '㈜호텔롯데 스카이힐 부여CC', 'chungnam', '부여군', '부여군 규암면 백제문로 470', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h8bdf33c0744e', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h9991ff8b1104', 'golf', '계룡산골프장', 'chungnam', '공주시', '공주시 계룡면 아랫난댕이길 17(내흥리)', null, null, 9, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h9991ff8b1104', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h4aac706988cf', 'golf', '골드리버CC', 'chungnam', '공주시', '공주시 의당면 신정말길 67-133(청룡리)', null, null, 9, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h4aac706988cf', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h7ade0cc2954b', 'golf', '골든베이골프&리조트', 'chungnam', '태안군', '태안군 근흥면 정선포로 217', null, null, 27, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h7ade0cc2954b', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h66163b612eb0', 'golf', '골프존카운티 천안', 'chungnam', '천안시 동남구', '병천면 매성2길 103', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h66163b612eb0', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hcef6a68586ec', 'golf', '내포골프클럽', 'chungnam', '예산군', '예산군 삽교읍 산수길 242(목리 1420)', null, null, 9, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hcef6a68586ec', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h93c705d6ba8a', 'golf', '더힐 컨트리클럽', 'chungnam', '논산시', '논산시 상월면 선비로 1079', null, null, 9, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h93c705d6ba8a', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h68805e410f64', 'golf', '도고컨트리 구락부', 'chungnam', '아산시', '선장면 삼봉산길 188', null, null, 18, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h68805e410f64', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h455110c8a65f', 'golf', '로얄링스1', 'chungnam', '태안군', '태안군 태안읍 반곡길 284', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h455110c8a65f', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hffd7eb2ba880', 'golf', '로얄링스2', 'chungnam', '태안군', '태안군 태안읍 반곡길 284', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hffd7eb2ba880', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h6348047987c5', 'golf', '마론컨트리클럽', 'chungnam', '천안시 동남구', '동남구 북면 납안5길 74', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h6348047987c5', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h50d90b11c8ef', 'golf', '백제컨트리클럽', 'chungnam', '부여군', '부여군 은산면 충절로 3734-82', null, null, 27, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h50d90b11c8ef', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h243e6a198724', 'golf', '보령베이스CC', 'chungnam', '보령시', '보령시 옥마벚길 10', null, null, 9, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h243e6a198724', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h5e59f9d54c15', 'golf', '서산수 골프앤리조트', 'chungnam', '서산시', '서산시 대산읍 삼길포7로 8', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h5e59f9d54c15', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h5bc0dbe49c6b', 'golf', '솔라고CC1', 'chungnam', '태안군', '태안군 태안읍 소곳이길 92-234', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h5bc0dbe49c6b', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-ha1f2405b4d39', 'golf', '솔라고CC2', 'chungnam', '태안군', '태안군 태안읍 소곳이길 92-234', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'ha1f2405b4d39', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-ha4507d27199d', 'golf', '스톤비치컨트리클럽', 'chungnam', '태안군', '태안군 근흥면 갈음이길 88', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'ha4507d27199d', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hde4d1bee816c', 'golf', '아리스타 CC', 'chungnam', '논산시', '연무읍 황화정리 산100', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hde4d1bee816c', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h05f425dae7f3', 'golf', '에딘버러 컨트리클럽', 'chungnam', '금산군', '금산군 진산면 살구정길 167', null, null, 18, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h05f425dae7f3', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h5da11c3cb9d8', 'golf', '에스앤 골프리조트', 'chungnam', '보령시', '보령시 남포면 양항리 650-2', null, null, 9, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h5da11c3cb9d8', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hc96e59da564d', 'golf', '에스지아름다운골프&리조트', 'chungnam', '아산시', '영인면 영인산로 440', null, null, 27, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hc96e59da564d', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-had6cb6293d02', 'golf', '우정힐스 컨트리클럽', 'chungnam', '천안시 동남구', '목천읍 충절로 1048-68', null, null, 18, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'had6cb6293d02', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h405ab12b9c06', 'golf', '천안상록 골프장', 'chungnam', '천안시 동남구', '수신면 수신로 576', null, null, 27, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h405ab12b9c06', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hf3fec9948c4f', 'golf', '파나시아 골프클럽', 'chungnam', '당진시', '당진시 신평면 계명길 33', null, null, 9, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hf3fec9948c4f', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h84b8c40bfe3c', 'golf', '파인스톤 컨트리클럽', 'chungnam', '당진시', '당진시 송산면 무수들길 90', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h84b8c40bfe3c', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h7c7d953d9f2b', 'golf', '프린세스 골프클럽', 'chungnam', '공주시', '공주시 정안면 방자들길 81-50(인풍리)', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h7c7d953d9f2b', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h6ebcc7842895', 'golf', '플라밍고C.C', 'chungnam', '당진시', '당진시 석문면 산단8로 299', null, null, 30, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h6ebcc7842895', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h62db535e24aa', 'golf', '구니컨트리클럽', 'daegu', '군위군', '대구광역시 군위군 군위읍 도군로 2450', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h62db535e24aa', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hf225bf7964c4', 'golf', '냉천컨트리클럽', 'daegu', '달성군', '대구광역시 달성군 가창면 가창로 1037-9', null, null, 9, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hf225bf7964c4', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h71faba3fb09c', 'golf', '오펠골프클럽', 'daegu', '군위군', '대구광역시 군위군 산성면 부흥로 227', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h71faba3fb09c', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hb2b6f88618f6', 'golf', '이지스카이컨트리클럽', 'daegu', '군위군', '대구광역시 군위군 군위읍 대흥1길 48-100', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hb2b6f88618f6', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hfb0b17c4c2e6', 'golf', '팔공컨트리클럽', 'daegu', '동구', '대구광역시 동구 팔공산로 237길 186', null, null, 18, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hfb0b17c4c2e6', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hed051733f057', 'golf', '금실대덕밸리CC', 'daejeon', '유성구', '대전 유성구 테크노중앙로 210(용산동 676번지)', null, null, 9, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hed051733f057', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hc576c2af3fb8', 'golf', '대덕복지센터', 'daejeon', '유성구', '대전 유성구 유성대로 1689번길 69(전민동 463번지)', null, null, 9, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hc576c2af3fb8', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h41e7e62ac6db', 'golf', '유성컨트리클럽', 'daejeon', '유성구', '대전 유성구 현충원로 200(덕명동 215-7번지)', null, null, 18, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h41e7e62ac6db', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h28a34bd2730a', 'golf', '남춘천컨트리클럽', 'gangwon', '춘천시', '춘천시 신동면 오봉길 156', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h28a34bd2730a', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hadeac3961608', 'golf', '더플레이어스 골프클럽', 'gangwon', '춘천시', '춘천시 동산면 새술막길 438', null, null, 27, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hadeac3961608', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h8c8f39c83ff7', 'golf', '동강시스타 골프장', 'gangwon', '영월군', '영월군 영월읍 사지막길 160', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h8c8f39c83ff7', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hda32baa47a44', 'golf', '동서울레스피아', 'gangwon', '원주시', '원주시 지정면 신평석화로 236', null, null, 9, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hda32baa47a44', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h6c8f7fc707b0', 'golf', '동원썬밸리컨트리클럽', 'gangwon', '횡성군', '횡성군 서원면 서원서로339번길 90', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h6c8f7fc707b0', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hc22f08d0c403', 'golf', '라데나골프클럽', 'gangwon', '춘천시', '춘천시 신동면 칠전동길 72', null, null, 27, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hc22f08d0c403', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h4995441f5fee', 'golf', '라비에벨컨트리클럽', 'gangwon', '춘천시', '춘천시 동산면 종자리로 436', null, null, 36, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h4995441f5fee', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h30abb1c7b0bd', 'golf', '로드힐스골프클럽', 'gangwon', '춘천시', '춘천시 동산면 종자리로 148-16', null, null, 27, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h30abb1c7b0bd', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hf6762ee70bdd', 'golf', '메이플비치골프&리조트', 'gangwon', '강릉시', '강릉시 강동면 풍호길 300-78', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hf6762ee70bdd', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h8f71be4b32ff', 'golf', '베어크리크 춘천', 'gangwon', '춘천시', '춘천시 신동면 김유정로 730', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h8f71be4b32ff', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hfeb9b80ba02f', 'golf', '벨라45 오너스 컨트리클럽', 'gangwon', '횡성군', '횡성군 서원면 창촌리 산132', null, null, 18, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hfeb9b80ba02f', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h4c4b1351242b', 'golf', '벨라45마스터스 컨트리클럽', 'gangwon', '횡성군', '횡성군 서원면 창촌리 산124', null, null, 27, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h4c4b1351242b', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h917846130539', 'golf', '벨라스톤컨트리클럽', 'gangwon', '횡성군', '횡성군 서원면 옥계9길 124', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h917846130539', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hf9f9c3822bc9', 'golf', '블랙밸리컨트리클럽', 'gangwon', '삼척시', '삼척시 도계읍 도상로 307-84', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hf9f9c3822bc9', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-heb5391464643', 'golf', '비콘힐스골프클럽', 'gangwon', '홍천군', '홍천군 홍천읍 높은터로 533', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'heb5391464643', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hd21fa1aa97a0', 'golf', '샌드파인골프클럽', 'gangwon', '강릉시', '강릉시 저동등길 53(저동)', null, null, 18, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hd21fa1aa97a0', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hefc71803be65', 'golf', '샤인데일골프&리조트', 'gangwon', '홍천군', '홍천군 서면 한서로 247-156', null, null, 27, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hefc71803be65', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h03502ebcf3c3', 'golf', '설악썬밸리컨트리클럽', 'gangwon', '고성군', '고성군 죽왕면 순포로 188', null, null, 27, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h03502ebcf3c3', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hfe1afeb90cff', 'golf', '설악프라자컨트리클럽', 'gangwon', '속초시', '속초시 미시령로2983번길 56-20', null, null, 18, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hfe1afeb90cff', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h2f23ea0c9a51', 'golf', '설해원', 'gangwon', '양양군', '양양군 손양면 공항로 230', null, null, 27, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h2f23ea0c9a51', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h187645205482', 'golf', '설해원더 레전드 코스', 'gangwon', '양양군', '양양군 손양면 공항로 230', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h187645205482', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h890e4ecc70ef', 'golf', '성문안 컨트리클럽', 'gangwon', '원주시', '원주시 지정면 월송석화로 431', null, null, 18, '비회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h890e4ecc70ef', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h1944152fd6f0', 'golf', '세이지우드CC홍천', 'gangwon', '홍천군', '홍천군 두촌면 광석로 898-160', null, null, 27, '비회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h1944152fd6f0', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hb94f412c120b', 'golf', '센추리21컨트리클럽', 'gangwon', '원주시', '원주시 문막읍 궁말길 193', null, null, 18, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hb94f412c120b', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h84af96c1310e', 'golf', '센추리21컨트리클럽Ⅱ', 'gangwon', '원주시', '원주시 문막읍 궁말길 193', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h84af96c1310e', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h0403a10d6cc0', 'golf', '센추리21퍼블릭', 'gangwon', '원주시', '원주시 문막읍 궁말길 193', null, null, 9, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h0403a10d6cc0', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hb462f55ef1de', 'golf', '소노펠리체 컨트리클럽 델피노', 'gangwon', '고성군', '고성군 토성면 미시령옛길 1153', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hb462f55ef1de', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h7b63ec00f491', 'golf', '소노펠리체 컨트리클럽 비발디파크 마운틴', 'gangwon', '홍천군', '홍천군 서면 한치골길 264', null, null, 9, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h7b63ec00f491', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hf040db4ed14c', 'golf', '소노펠리체 컨트리클럽 비발디파크 웨스트', 'gangwon', '홍천군', '홍천군 서면 한치골길 200', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hf040db4ed14c', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h859a0be19021', 'golf', '소노펠리체 컨트리클럽 비발디파크 이스트', 'gangwon', '홍천군', '홍천군 서면 한치골길 541-123', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h859a0be19021', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hf5c887e3c757', 'golf', '스프링베일리조트', 'gangwon', '춘천시', '춘천시 동면 금베이길 93-27', null, null, 9, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hf5c887e3c757', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h6c99f179052e', 'golf', '알펜시아 700골프클럽', 'gangwon', '평창군', '평창군 대관령면 솔봉로 325', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h6c99f179052e', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h17c96c3afe92', 'golf', '알펜시아컨트리클럽', 'gangwon', '평창군', '평창군 대관령면 솔봉로 325', null, null, 27, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h17c96c3afe92', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h7db2d760b235', 'golf', '알프스대영컨트리클럽', 'gangwon', '횡성군', '횡성군 우천면 한우로 1295', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h7db2d760b235', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h5c4e4ee2069b', 'golf', '에콜리안정선골프장', 'gangwon', '정선군', '정선군 신동읍 새골길 112-49', null, null, 9, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h5c4e4ee2069b', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h11803ba82820', 'golf', '엘리시안 강촌컨트리클럽', 'gangwon', '춘천시', '춘천시 남산면 북한강변길 688', null, null, 27, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h11803ba82820', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hfefac9f0d5a2', 'golf', '영랑호컨트리클럽', 'gangwon', '속초시', '속초시 영랑호반길 170', null, null, 9, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hfefac9f0d5a2', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-heb341b99d4aa', 'golf', '오너스골프클럽', 'gangwon', '춘천시', '춘천시 남산면 동촌로 667', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'heb341b99d4aa', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h0d8aa453f09e', 'golf', '오로라 골프 앤 리조트', 'gangwon', '원주시', '원주시 신림면 구학산로 1520', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h0d8aa453f09e', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h20776180bfa5', 'golf', '오크밸리회원제골프장', 'gangwon', '원주시', '원주시 지정면 오크밸리1길 66', null, null, 36, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h20776180bfa5', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h8905013e1058', 'golf', '올데이 옥스필드', 'gangwon', '횡성군', '횡성군 서원면 경강로 유현6길 28', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h8905013e1058', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h5b2fdf462b4a', 'golf', '용평리조트골프클럽', 'gangwon', '평창군', '평창군 대관령면 올림픽로 715', null, null, 18, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h5b2fdf462b4a', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h2b3405914e99', 'golf', '용평리조트대중골프장', 'gangwon', '평창군', '평창군 대관령면 올림픽로 715', null, null, 9, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h2b3405914e99', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h0e7e1960af8d', 'golf', '용평버치힐골프클럽', 'gangwon', '평창군', '평창군 대관령면 올림픽로 715', null, null, 18, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h0e7e1960af8d', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h0da24794e516', 'golf', '월송리 컨트리클럽', 'gangwon', '원주시', '원주시 지정면 오크밸리2길 250', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h0da24794e516', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h45415144379b', 'golf', '웰리힐리컨트리클럽', 'gangwon', '횡성군', '횡성군 둔내면 고원로 451', null, null, 36, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h45415144379b', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hdc94cba465d0', 'golf', '웰리힐리퍼블릭', 'gangwon', '횡성군', '횡성군 둔내면 고원로 451', null, null, 10, '비회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hdc94cba465d0', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h42473cf6c399', 'golf', '인터불고원주골프클럽', 'gangwon', '원주시', '원주시 동부순환로 200(반곡동)', null, null, 9, '비회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h42473cf6c399', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h204fcebc3462', 'golf', '제이드팰리스 골프클럽', 'gangwon', '춘천시', '춘천시 남산면 경춘로 212-30', null, null, 18, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h204fcebc3462', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h808c2e90dc09', 'golf', '카스카디아 골프클럽', 'gangwon', '홍천군', '홍천군 북방면 팔봉산로 1759', null, null, 27, '비회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h808c2e90dc09', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h935368b63503', 'golf', '클럽모우골프 &라이프스타일', 'gangwon', '홍천군', '홍천군 서면 장락동길 111', null, null, 27, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h935368b63503', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h5f90658eef4e', 'golf', '파가니카컨트리클럽', 'gangwon', '춘천시', '춘천시 남면 소주고개로 145-10', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h5f90658eef4e', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-he5e4da8abb58', 'golf', '파인리즈컨트리클럽', 'gangwon', '고성군', '고성군 토성면 잼버리동로 267', null, null, 27, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'he5e4da8abb58', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hd292999fe784', 'golf', '파인밸리컨트리클럽', 'gangwon', '삼척시', '삼척시 근덕면 미근로 1629', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hd292999fe784', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h25a8050aaddc', 'golf', '파크밸리골프클럽', 'gangwon', '원주시', '원주시 소초면 바우실길 281', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h25a8050aaddc', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hc0145315901d', 'golf', '하이원컨트리클럽', 'gangwon', '정선군', '정선군 고한읍 고한7길 399', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hc0145315901d', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h1742e55dab2e', 'golf', '한탄강컨트리클럽', 'gangwon', '철원군', '철원군 갈말읍 순담길 59', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h1742e55dab2e', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h0660a2c69c19', 'golf', '휘닉스 컨트리클럽', 'gangwon', '평창군', '평창군 봉평면 태기로 227-84', null, null, 18, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h0660a2c69c19', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h142e2dde55f7', 'golf', '휘닉스대중골프장', 'gangwon', '평창군', '평창군 봉평면 태기로 227-84', null, null, 6, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h142e2dde55f7', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h57b6dd39670a', 'golf', '휘슬링락컨트리클럽', 'gangwon', '춘천시', '춘천시 남산면 동촌로 501', null, null, 27, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h57b6dd39670a', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h06168433a613', 'golf', '힐드로사이컨트리클럽', 'gangwon', '홍천군', '홍천군 남면 한서로 2840', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h06168433a613', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h87e59b18ae62', 'golf', 'O2리조트 골프장', 'gangwon', '태백시', '태백시 서학로 861', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h87e59b18ae62', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hebc3f6fb386f', 'golf', 'O2리조트 퍼블릭골프장', 'gangwon', '태백시', '태백시 서학로 861', null, null, 9, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hebc3f6fb386f', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-he2206d18da88', 'golf', 'Oak Hills컨트리클럽', 'gangwon', '원주시', '원주시 지정면 오크밸리2길 58', null, null, 18, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'he2206d18da88', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h705a9bd19655', 'golf', '빛고을컨트리클럽', 'gwangju', '남구', '광주광역시 남구 효우로 153(노대동)', null, null, 9, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h705a9bd19655', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h5c880f50519f', 'golf', '어등산컨트리클럽', 'gwangju', '광산구', '광주광역시 광산구 무진대로 31(운수동)', null, null, 27, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h5c880f50519f', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h2f9afdbcb5fd', 'golf', '에콜리안광산골프장', 'gwangju', '광산구', '광주광역시 광산구 오목내길 26(연산동)', null, null, 9, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h2f9afdbcb5fd', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h69944a2786da', 'golf', '가든골프클럽', 'gyeongbuk', '경주시', '경상북도 경주시 불국로 289-17', null, null, 9, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h69944a2786da', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h781087b76b13', 'golf', '경주신라C.C', 'gyeongbuk', '경주시', '경상북도 경주시 보문로 319', null, null, 36, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h781087b76b13', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hd1983e87ec1e', 'golf', '경주C.C', 'gyeongbuk', '경주시', '경상북도 경주시 보문로 182-98', null, null, 27, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hd1983e87ec1e', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h1ff29c237538', 'golf', '골프존카운티 감포', 'gyeongbuk', '경주시', '경상북도 경주시 감포읍 동해안로 1819-59', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h1ff29c237538', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h63ca12daf468', 'golf', '골프존카운티 구미', 'gyeongbuk', '구미시', '경상북도 구미시 산동면 강동로 953-74', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h63ca12daf468', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h397b197fbb8c', 'golf', '골프존카운티 선산', 'gyeongbuk', '구미시', '경상북도 구미시 산동면 강동로 953-73', null, null, 18, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h397b197fbb8c', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hf0965f2a07e5', 'golf', '구미C.C', 'gyeongbuk', '구미시', '경상북도 구미시 장천면 송백로 229', null, null, 27, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hf0965f2a07e5', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hf3b4b0f72559', 'golf', '그레이스C.C', 'gyeongbuk', '청도군', '경상북도 청도군 이서면 서녁길 91', null, null, 27, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hf3b4b0f72559', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hcc499e898dc9', 'golf', '남안동C.C', 'gyeongbuk', '안동시', '경상북도 안동시 일직면 풍일로 1887', null, null, 18, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hcc499e898dc9', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h609edb5eb1bd', 'golf', '뉴스프링빌Ⅱ', 'gyeongbuk', '상주시', '경상북도 상주시 모서면 백화로 40', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h609edb5eb1bd', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h58cbcbfe6608', 'golf', '다산 샤인힐CC', 'gyeongbuk', '고령군', '경상북도 고령군 다산면 벌지로 175-115', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h58cbcbfe6608', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h0f36d0e23c59', 'golf', '대가야CC', 'gyeongbuk', '고령군', '경상북도 고령군 대가야읍 대가야로 1103', null, null, 9, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h0f36d0e23c59', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h25cb04ccf0ef', 'golf', '대구C.C', 'gyeongbuk', '경산시', '경상북도 경산시 진량읍 일연로 718-42', null, null, 27, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h25cb04ccf0ef', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h2e675afc8b06', 'golf', '디아너스C.C', 'gyeongbuk', '경주시', '경상북도 경주시 보불로 391', null, null, 27, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h2e675afc8b06', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hca385a605e2d', 'golf', '마린CC', 'gyeongbuk', '울진군', '경상북도 울진군 매화면 매화로 115-99', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hca385a605e2d', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h922dd6527a36', 'golf', '마스터피스CC', 'gyeongbuk', '고령군', '경상북도 고령군 쌍림면 산막길 47-80', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h922dd6527a36', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hc122a2f33a07', 'golf', '마우나오션블루', 'gyeongbuk', '경주시', '경상북도 경주시 양남면 동남로 982', null, null, 9, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hc122a2f33a07', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h437f62d84d74', 'golf', '마우나오션C.C', 'gyeongbuk', '경주시', '경상북도 경주시 양남면 동남로 982', null, null, 18, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h437f62d84d74', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h0294d370f34c', 'golf', '마이다스 구미 골프아카데미', 'gyeongbuk', '칠곡군', '경상북도 칠곡군 가산면 학하2길 54-171', null, null, 9, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h0294d370f34c', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h1f8ca27a5c1a', 'golf', '문경레저타운골프장', 'gyeongbuk', '문경시', '경상북도 문경시 마성면 문경골프장길 240', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h1f8ca27a5c1a', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h3cf153292fec', 'golf', '보문G.C', 'gyeongbuk', '경주시', '경상북도 경주시 보문로 182-14', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h3cf153292fec', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hd144e830313d', 'golf', '블루원상주골프리조트', 'gyeongbuk', '상주시', '경상북도 상주시 모서면 화현3길 127', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hd144e830313d', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-habb070e30ebc', 'golf', '서라벌G.C', 'gyeongbuk', '경주시', '경상북도 경주시 외동읍 내외로 577-189', null, null, 45, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'habb070e30ebc', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31'),
    ('mcst-golf-nationwide', 'he73c714e33e3', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h58340f8fb014', 'golf', '선리치G.C', 'gyeongbuk', '경주시', '경상북도 경주시 안강읍 검단장골길 181-17', null, null, 9, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h58340f8fb014', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h91a5d6baeadf', 'golf', '세븐밸리C.C', 'gyeongbuk', '칠곡군', '경상북도 칠곡군 왜관읍 봉계3길 180', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h91a5d6baeadf', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hf89b6103c60a', 'golf', '시엘G.C', 'gyeongbuk', '영천시', '경상북도 영천시 청통면 청통로 334-41', null, null, 9, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hf89b6103c60a', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hf281e3646f88', 'golf', '안강레전드G.C', 'gyeongbuk', '경주시', '경상북도 경주시 안강읍 낙산길 85', null, null, 9, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hf281e3646f88', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hab4552a5b5ee', 'golf', '안동레이크골프클럽', 'gyeongbuk', '안동시', '경상북도 안동시 관광단지로 316', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hab4552a5b5ee', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h3bfd158db881', 'golf', '안동리버힐C.C', 'gyeongbuk', '안동시', '경상북도 안동시 풍천면 풍일로 1572', null, null, 18, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h3bfd158db881', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-haaa2437ce59a', 'golf', '애플밸리C.C', 'gyeongbuk', '김천시', '경상북도 김천시 어모면 작점로 606', null, null, 9, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'haaa2437ce59a', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h2173666b3536', 'golf', '엠스클럽의성', 'gyeongbuk', '의성군', '경상북도 의성군 봉양면 농공마전길 125-78', null, null, 27, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h2173666b3536', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31'),
    ('mcst-golf-nationwide', 'h20abe0b9bd82', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-ha3e23c07048e', 'golf', '영천C.C', 'gyeongbuk', '영천시', '경상북도 영천시 임고면 방목길 34-2', null, null, 27, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'ha3e23c07048e', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h2241c1ceb6e5', 'golf', '오션비치C.C', 'gyeongbuk', '영덕군', '경상북도 영덕군 강구면 동해대로 4265-43', null, null, 27, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h2241c1ceb6e5', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hfc8923955b44', 'golf', '오션힐스청도G.C', 'gyeongbuk', '청도군', '경상북도 청도군 매전면 곰티로 370-204', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hfc8923955b44', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hfa66d8e4cd45', 'golf', '오션힐스포항C.C', 'gyeongbuk', '포항시 북구', '경상북도 포항시 북구 송라면 대전길 7', null, null, 27, '회원제 · 대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hfa66d8e4cd45', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31'),
    ('mcst-golf-nationwide', 'hd6fb988caa1e', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h86dbf2f85b91', 'golf', '오펠G.C', 'gyeongbuk', '영천시', '경상북도 영천시 고경면 호국로 1221-24', null, null, 27, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h86dbf2f85b91', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h4fff3f59b168', 'golf', '우리G.C', 'gyeongbuk', '경주시', '경상북도 경주시 양남면 동남로 972', null, null, 9, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h4fff3f59b168', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h908b9ba15c86', 'golf', '유니밸리C.C', 'gyeongbuk', '고령군', '경상북도 고령군 고령읍 일량로 588', null, null, 9, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h908b9ba15c86', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-ha09063772f2b', 'golf', '이스트힐C.C', 'gyeongbuk', '경주시', '경상북도 경주시 양남면 외남로 1377', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'ha09063772f2b', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hdffd7d18a7ab', 'golf', '인터불고컨트리클럽', 'gyeongbuk', '경산시', '경상북도 경산시 삼성현로 614-26', null, null, 27, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hdffd7d18a7ab', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h9ad7fad55d35', 'golf', '청통골프장', 'gyeongbuk', '영천시', '경상북도 영천시 청통면 청통로 733', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h9ad7fad55d35', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hebf39f5cf416', 'golf', '청하이스턴C.C', 'gyeongbuk', '포항시', '경상북도 포항시 청하면 용산길 94', null, null, 9, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hebf39f5cf416', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h9a3726afe809', 'golf', '칠곡아이위시C.C', 'gyeongbuk', '칠곡군', '경상북도 칠곡군 기산면 노석1길 49-112', null, null, 9, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h9a3726afe809', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h3434a7696723', 'golf', '파라지오C.C', 'gyeongbuk', '의성군', '경상북도 의성군 봉양면 농공마전길 167', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h3434a7696723', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h05af3ba56bcc', 'golf', '파미힐스C.C', 'gyeongbuk', '칠곡군', '경상북도 칠곡군 왜관읍 봉계로 263', null, null, 36, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h05af3ba56bcc', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hff48a4c3ee95', 'golf', '펜타뷰골프클럽', 'gyeongbuk', '청도군', '경상북도 청도군 금천면 금천로 709', null, null, 9, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hff48a4c3ee95', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h2ab3a2a81e7f', 'golf', '포도C.C', 'gyeongbuk', '김천시', '경상북도 김천시 구성면 남김천대로 2532', null, null, 27, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h2ab3a2a81e7f', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hfc52cbea1fd7', 'golf', '포항C.C', 'gyeongbuk', '포항시', '경상북도 포항시 송라면 동해대로 2751번길 123', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hfc52cbea1fd7', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hca3f46f45d92', 'golf', '한맥C.C&노블리아', 'gyeongbuk', '예천군', '경상북도 예천군 호명면 한맥골프장길 72', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hca3f46f45d92', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hd68d28f677cb', 'golf', '힐스카이C.C', 'gyeongbuk', '경주시', '경상북도 경주시 천북면 천강로 412-299', null, null, 24, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hd68d28f677cb', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h801fd9d95343', 'golf', '1·2·3 골프장', 'gyeonggi', '고양시 덕양구', '경기도 고양시 덕양구 통일로 43-168', null, null, 6, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h801fd9d95343', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h80cb02b7bd58', 'golf', '360도 컨트리클럽', 'gyeonggi', '여주시', '경기도 여주시 강천면 부평로 609', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h80cb02b7bd58', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h2f3a12f875ad', 'golf', '가평 베네스트G.C', 'gyeonggi', '가평군', '경기도 가평군 상면 둔덕말길 232', null, null, 27, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h2f3a12f875ad', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hdbfd9d7917ed', 'golf', '강남300 컨트리클럽', 'gyeonggi', '광주시', '경기도 광주시 새말길 353(목동)', null, null, 18, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hdbfd9d7917ed', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h055e26c365d2', 'golf', '고양컨트리클럽', 'gyeonggi', '고양시 덕양구', '경기도 고양시 덕양구 흥도로 304-23', null, null, 9, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h055e26c365d2', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h677b57a870c6', 'golf', '곤지암GC', 'gyeonggi', '광주시', '경기도 광주시 도척면 도척윗로 280', null, null, 18, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h677b57a870c6', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h9ace689e5d06', 'golf', '골드컨트리클럽', 'gyeonggi', '용인시 기흥구', '경기도 용인시 기흥구 기흥단지로 398', null, null, 36, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h9ace689e5d06', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h762d8f6fb49c', 'golf', '골프존카운티 안성H', 'gyeonggi', '안성시', '경기도 안성시 보개면 보삼로 302', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h762d8f6fb49c', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h3bb3690e6686', 'golf', '골프존카운티 안성W', 'gyeonggi', '안성시', '경기도 안성시 양성면 교동길 19-70', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h3bb3690e6686', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h36a136f6526b', 'golf', '골프클럽Q', 'gyeonggi', '안성시', '경기도 안성시 죽산면 장계길 20-229', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h36a136f6526b', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h3f11dc7875fc', 'golf', '광릉CC(비회원제)', 'gyeonggi', '남양주시', '경기도 남양주시 진접읍 팔야로 280', null, null, 6, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h3f11dc7875fc', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h861d894dd4f4', 'golf', '광릉CC(회원제)', 'gyeonggi', '남양주시', '경기도 남양주시 진접읍 팔야로 280', null, null, 18, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h861d894dd4f4', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h248228066fa1', 'golf', '국가보훈부 88골프장', 'gyeonggi', '용인시 기흥구', '경기도 용인시 기흥구 석성로 521번길 169', null, null, 36, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h248228066fa1', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-ha63abbf2cb3d', 'golf', '그린힐 컨트리클럽', 'gyeonggi', '광주시', '경기도 광주시 곤지암읍 내선길 176', null, null, 18, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'ha63abbf2cb3d', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h7199dc161ca4', 'golf', '글렌로스 골프클럽', 'gyeonggi', '용인시 처인구', '경기도 용인시 처인구 포곡읍 에버랜드로 562번길 69', null, null, 9, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h7199dc161ca4', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h30aaa492faf0', 'golf', '금강컨트리클럽(대중)', 'gyeonggi', '여주시', '경기도 여주시 가남읍 여주남로 541', null, null, 9, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h30aaa492faf0', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h6f438c49b8e2', 'golf', '금강컨트리클럽(회원)', 'gyeonggi', '여주시', '경기도 여주시 가남읍 여주남로 541', null, null, 18, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h6f438c49b8e2', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h716bcbe59791', 'golf', '기흥컨트리클럽', 'gyeonggi', '화성시', '경기도 화성시 풀무골로106번길 244', null, null, 36, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h716bcbe59791', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h3cc36ad27e12', 'golf', '김포SEASIDE 컨트리클럽', 'gyeonggi', '김포시', '경기도 김포시 월곶면 김포대로 2081번길 219', null, null, 18, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h3cc36ad27e12', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-ha47a842a6d2f', 'golf', '남부컨트리클럽', 'gyeonggi', '용인시 기흥구', '경기도 용인시 기흥구 사은로 163', null, null, 18, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'ha47a842a6d2f', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h0a30f5b1d504', 'golf', '남서울컨트리클럽', 'gyeonggi', '성남시 분당구', '경기도 성남시 분당구 판교백현로 161', null, null, 18, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h0a30f5b1d504', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hcf42b5ddea56', 'golf', '남양주CC', 'gyeonggi', '남양주시', '경기도 남양주시 오남읍 진건오남로 516-31', null, null, 9, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hcf42b5ddea56', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h7225405abda0', 'golf', '남여주대중골프장', 'gyeonggi', '여주시', '경기도 여주시 가여로 532', null, null, 27, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h7225405abda0', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hc8f46c276f48', 'golf', '남촌컨트리클럽', 'gyeonggi', '광주시', '경기도 광주시 곤지암읍 부항길 135-38', null, null, 18, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hc8f46c276f48', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hfa050c9c14d0', 'golf', '노스팜 컨트리클럽', 'gyeonggi', '파주시', '경기도 파주시 광탄면 쇠장이길 265', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hfa050c9c14d0', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h9e3f50987bba', 'golf', '뉴서울컨트리클럽', 'gyeonggi', '광주시', '경기도 광주시 삼지곡길 95(삼동)', null, null, 36, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h9e3f50987bba', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h26d730322609', 'golf', '뉴스프링빌골프장', 'gyeonggi', '이천시', '경기도 이천시 모가면 사실로 527번길 158', null, null, 36, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h26d730322609', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h5d08f9bc87a4', 'golf', '뉴스프링빌골프장(대중형)', 'gyeonggi', '이천시', '경기도 이천시 모가면 사실로 527번길 158', null, null, 9, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h5d08f9bc87a4', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h52eec775908f', 'golf', '뉴코리아 컨트리클럽', 'gyeonggi', '고양시 덕양구', '경기도 고양시 덕양구 신원2로 57', null, null, 18, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h52eec775908f', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h7b142e78e5bc', 'golf', '더반 골프클럽', 'gyeonggi', '이천시', '경기도 이천시 대월면 대월로 627-141', null, null, 9, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h7b142e78e5bc', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h9c79e2aca221', 'golf', '더스타휴 컨트리클럽', 'gyeonggi', '양평군', '경기도 양평군 양동면 양동로 756', null, null, 18, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h9c79e2aca221', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h3da31e188876', 'golf', '더크로스비골프클럽', 'gyeonggi', '이천시', '경기도 이천시 호법면 중부대로798번길 177', null, null, 27, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h3da31e188876', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h747cf66d7a28', 'golf', '더헤븐 컨트리클럽', 'gyeonggi', '안산시 단원구', '경기도 안산시 단원구 대선로466(대부남동)', null, null, 27, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h747cf66d7a28', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h63d2e15661b5', 'golf', '라비돌컨트리클럽', 'gyeonggi', '화성시', '경기도 화성시 정남면 세자로 286', null, null, 9, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h63d2e15661b5', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-ha1382261330c', 'golf', '라싸 골프클럽', 'gyeonggi', '포천시', '경기도 포천시 이동면 제비울2길 161', null, null, 27, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'ha1382261330c', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h1ecb380ac2f7', 'golf', '레이크사이드CC(대중제)', 'gyeonggi', '용인시 처인구', '경기도 용인시 처인구 모현읍 능원로 181', null, null, 36, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h1ecb380ac2f7', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h56e2598caab5', 'golf', '레이크사이드CC(회원제)', 'gyeonggi', '용인시 처인구', '경기도 용인시 처인구 모현읍 능원로 181', null, null, 18, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h56e2598caab5', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hc1d3415ec2dc', 'golf', '레이크우드 골프장(비회원제)', 'gyeonggi', '양주시', '경기도 양주시 만송로 244', null, null, 9, '비회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hc1d3415ec2dc', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h9b6ab0359185', 'golf', '레이크우드 골프장(회원제)', 'gyeonggi', '양주시', '경기도 양주시 만송로 244', null, null, 27, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h9b6ab0359185', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h9c50fa77b86a', 'golf', '렉스필드 컨트리클럽(비회원)', 'gyeonggi', '여주시', '경기도 여주시 산북면 광여로 1115', null, null, 9, '비회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h9c50fa77b86a', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hf3562cd89b82', 'golf', '렉스필드 컨트리클럽(회원)', 'gyeonggi', '여주시', '경기도 여주시 산북면 광여로 1115', null, null, 18, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hf3562cd89b82', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h076456deaba7', 'golf', '로제비앙GC', 'gyeonggi', '광주시', '경기도 광주시 곤지암읍 오항길 180', null, null, 27, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h076456deaba7', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h5048277ac008', 'golf', '리베라컨트리클럽', 'gyeonggi', '화성시', '경기도 화성시 중리길 183', null, null, 36, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h5048277ac008', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h4c5d119bf146', 'golf', '리앤리C.C', 'gyeonggi', '가평군', '경기도 가평군 조종면 운악청계로 702-24', null, null, 27, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h4c5d119bf146', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h5b4dbb0b0bb9', 'golf', '링크나인골프클럽', 'gyeonggi', '화성시', '경기도 화성시 마도면 해운로630번길 49', null, null, 9, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h5b4dbb0b0bb9', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-he56e01a969e3', 'golf', '마에스트로 CC', 'gyeonggi', '안성시', '경기도 안성시 양성면 안성맞춤대로 2134-36', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'he56e01a969e3', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-he35d19150247', 'golf', '마이다스레이크 이천 골프&리조트', 'gyeonggi', '이천시', '경기도 이천시 설성면 설가로 602', null, null, 27, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'he35d19150247', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h5237638cf414', 'golf', '마이다스밸리 청평 골프클럽', 'gyeonggi', '가평군', '경기도 가평군 설악면 다락재로 73-111', null, null, 18, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h5237638cf414', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h226f2ce304a0', 'golf', '몽베르 컨트리클럽(비회원제)', 'gyeonggi', '포천시', '경기도 포천시 영북면 산정호수로 359-13', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h226f2ce304a0', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hb3f55053efc8', 'golf', '몽베르 컨트리클럽(회원제)', 'gyeonggi', '포천시', '경기도 포천시 영북면 산정호수로 359-12', null, null, 18, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hb3f55053efc8', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hf46d65960461', 'golf', '발리오스컨트리클럽(비회원제)', 'gyeonggi', '화성시', '경기도 화성시 팔탄면 3.1만세로 641-28', null, null, 9, '비회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hf46d65960461', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h5f065a18c682', 'golf', '발리오스컨트리클럽(회원제)', 'gyeonggi', '화성시', '경기도 화성시 팔탄면 3.1만세로 641-28', null, null, 18, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h5f065a18c682', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h49a06aef9200', 'golf', '베뉴지CC', 'gyeonggi', '가평군', '경기도 가평군 가평읍 용추로 171번길 100', null, null, 27, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h49a06aef9200', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h2d2e83a0e9ea', 'golf', '베스트밸리 골프클럽', 'gyeonggi', '파주시', '경기도 파주시 광탄면 장지산로200번길 32-41', null, null, 9, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h2d2e83a0e9ea', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h6ea7a3e1379b', 'golf', '베어크리크골프클럽', 'gyeonggi', '포천시', '경기도 포천시 화현면 달인동로 35', null, null, 36, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h6ea7a3e1379b', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h538b50dd276e', 'golf', '블랙스톤골프장(대중형)', 'gyeonggi', '이천시', '경기도 이천시 장호원읍 장여로 459-160', null, null, 9, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h538b50dd276e', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h6830e3736ec7', 'golf', '블랙스톤골프장(회원제)', 'gyeonggi', '이천시', '경기도 이천시 장호원읍 장여로 459-160', null, null, 18, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h6830e3736ec7', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-he414f0ff67f1', 'golf', '블루원용인CC(비회원제)', 'gyeonggi', '용인시 처인구', '경기도 용인시 처인구 원삼면 보개원삼로 1534번길 40', null, null, 9, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'he414f0ff67f1', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hb15ad185d6ab', 'golf', '블루원용인CC(회원제)', 'gyeonggi', '용인시 처인구', '경기도 용인시 처인구 원삼면 보개원삼로 1534번길 40', null, null, 18, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hb15ad185d6ab', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h874c4a19a4d0', 'golf', '블루헤런G.C', 'gyeonggi', '여주시', '경기도 여주시 대신면 고달사로 67', null, null, 18, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h874c4a19a4d0', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hb7c994db0672', 'golf', '비에이비스타골프장(회원)', 'gyeonggi', '이천시', '경기도 이천시 모가면 어농로 272', null, null, 41, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hb7c994db0672', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h226477f360ea', 'golf', '비에이비스타컨트리클럽(비회원)', 'gyeonggi', '이천시', '경기도 이천시 모가면 어농로 272', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h226477f360ea', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h1be0d9c66553', 'golf', '비전힐스CC', 'gyeonggi', '남양주시', '경기도 남양주시 화도읍 마치로 226-220', null, null, 18, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h1be0d9c66553', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hf54178788d89', 'golf', '빅토리아일반대중골프장', 'gyeonggi', '여주시', '경기도 여주시 가남읍 송삼로 191', null, null, 9, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hf54178788d89', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h91a1ffb62325', 'golf', '사우스스프링스C.C', 'gyeonggi', '이천시', '경기도 이천시 모가면 공원로 64', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h91a1ffb62325', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h4a0fd2b8084e', 'golf', '샴발라 컨트리클럽', 'gyeonggi', '포천시', '경기도 포천시 군내면 청군로 2856-93', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h4a0fd2b8084e', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h30cb0874672d', 'golf', '서서울 컨트리클럽', 'gyeonggi', '파주시', '경기도 파주시 광탄면 혜음로 324', null, null, 18, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h30cb0874672d', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hdd36dfe99da5', 'golf', '서원밸리 골프장', 'gyeonggi', '파주시', '경기도 파주시 광탄면 서원길 333', null, null, 18, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hdd36dfe99da5', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hc0db4b41d10a', 'golf', '서원힐스 골프장', 'gyeonggi', '파주시', '경기도 파주시 광탄면 서원길 333', null, null, 27, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hc0db4b41d10a', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h088a49dedda4', 'golf', '석천CC', 'gyeonggi', '용인시 처인구', '경기도 용인시 처인구 백암면 황새울로 255', null, null, 9, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h088a49dedda4', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h1f97dbe7014c', 'golf', '세라지오GC', 'gyeonggi', '여주시', '경기도 여주시 여양로 530', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h1f97dbe7014c', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hf2c7db401636', 'golf', '세현CC', 'gyeonggi', '용인시 처인구', '경기도 용인시 처인구 이동읍 백자로 450', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hf2c7db401636', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h1aaad128cdbe', 'golf', '소피아그린', 'gyeonggi', '여주시', '경기도 여주시 점동면 소피아그린길 84', null, null, 27, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h1aaad128cdbe', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h405bf6c1bb00', 'golf', '솔모로골프장', 'gyeonggi', '여주시', '경기도 여주시 가남읍 솔모로그린길 171', null, null, 36, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h405bf6c1bb00', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h14aad50ef436', 'golf', '솔트베이 골프클럽', 'gyeonggi', '시흥시', '경기도 시흥시 마유로 987 (장곡동)', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h14aad50ef436', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-ha5a616236c83', 'golf', '송추 컨트리클럽', 'gyeonggi', '양주시', '경기도 양주시 광적면 쇠장이길 435', null, null, 18, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'ha5a616236c83', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h922d8eef86c4', 'golf', '수원컨트리클럽', 'gyeonggi', '용인시 기흥구', '경기도 용인시 기흥구 중부대로 495', null, null, 36, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h922d8eef86c4', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h5c3a100ad75f', 'golf', '스마트KU 골프 파빌리온', 'gyeonggi', '파주시', '경기도 파주시 법원읍 보광로 1616', null, null, 27, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h5c3a100ad75f', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-heecac6d70932', 'golf', '스카이밸리골프장(비회원)', 'gyeonggi', '여주시', '경기도 여주시 북내면 운촌길 254', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'heecac6d70932', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h9d71ffda096c', 'golf', '스카이밸리골프장(회원)', 'gyeonggi', '여주시', '경기도 여주시 북내면 운촌길 254', null, null, 18, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h9d71ffda096c', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h0b426605ea6f', 'golf', '신라컨트리클럽', 'gyeonggi', '여주시', '경기도 여주시 북내면 신라그린길 84', null, null, 27, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h0b426605ea6f', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h0054e9654a70', 'golf', '신안 퍼블릭 CC', 'gyeonggi', '안성시', '경기도 안성시 고삼면 개울말길 149', null, null, 9, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h0054e9654a70', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h1ee37e8f0755', 'golf', '신안컨트리클럽', 'gyeonggi', '안성시', '경기도 안성시 고삼면 개울말길 149', null, null, 18, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h1ee37e8f0755', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h5b781e6aefba', 'golf', '신원CC', 'gyeonggi', '용인시', '경기도 용인시 이동읍 이원로 225', null, null, 27, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h5b781e6aefba', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-ha420c5821177', 'golf', '써닝포인트 컨트리클럽', 'gyeonggi', '용인시 처인구', '경기도 용인시 처인구 백암면 고안로 51번길 205', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'ha420c5821177', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h7a462ea07d35', 'golf', '썬힐G.C', 'gyeonggi', '가평군', '경기도 가평군 조종면 운악청계로 809', null, null, 36, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h7a462ea07d35', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h7489b308f1a6', 'golf', '아난티클럽서울', 'gyeonggi', '가평군', '경기도 가평군 설악면 유명로 961-34', null, null, 27, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h7489b308f1a6', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-he8cba8bae907', 'golf', '아리지 골프장', 'gyeonggi', '여주시', '경기도 여주시 가남읍 아리지그린길 68', null, null, 27, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'he8cba8bae907', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h65613dad2417', 'golf', '아세코밸리골프클럽', 'gyeonggi', '시흥시', '경기도 시흥시 마전로 307 (거모동)', null, null, 9, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h65613dad2417', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hf84470759a41', 'golf', '아시아나컨트리클럽', 'gyeonggi', '용인시 처인구', '경기도 용인시 처인구 양지면 양대로 290', null, null, 36, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hf84470759a41', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hc34547246919', 'golf', '안성베네스트골프클럽 일반대중홀', 'gyeonggi', '안성시', '경기도 안성시 금광면 삼흥로 660', null, null, 9, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hc34547246919', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h65669a38b6ad', 'golf', '안성베네스트G.C', 'gyeonggi', '안성시', '경기도 안성시 금광면 삼흥로 660', null, null, 27, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h65669a38b6ad', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-he50937c77b34', 'golf', '안성컨트리클럽', 'gyeonggi', '안성시', '경기도 안성시 죽산면 걸미로 487', null, null, 18, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'he50937c77b34', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hc15e848cb3c6', 'golf', '안양컨트리클럽', 'gyeonggi', '군포시', '경기도 군포시 군포로364(부곡동)', null, null, 18, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hc15e848cb3c6', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h99b1732579b7', 'golf', '양주 컨트리클럽', 'gyeonggi', '남양주시', '경기도 남양주시 화도읍 북한강로 1525-52', null, null, 18, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h99b1732579b7', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h42f79025b978', 'golf', '양지파인골프클럽', 'gyeonggi', '용인시 처인구', '경기도 용인시 처인구 양지면 남평로 112', null, null, 27, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h42f79025b978', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hfdfe64782468', 'golf', '양평TPC GC', 'gyeonggi', '양평군', '경기도 양평군 지평면 대평평장길 113-8', null, null, 27, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hfdfe64782468', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h2dc6200fcddc', 'golf', '에덴블루 컨트리클럽', 'gyeonggi', '안성시', '경기도 안성시 죽산면 녹배길 175', null, null, 27, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h2dc6200fcddc', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hd8b37b276c4f', 'golf', '에이치원 클럽', 'gyeonggi', '이천시', '경기도 이천시 호법면 장자터로 115', null, null, 18, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hd8b37b276c4f', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-ha6db71e25a2a', 'golf', '여주썬밸리 컨트리클럽', 'gyeonggi', '여주시', '경기도 여주시 강천면 강문로 872', null, null, 9, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'ha6db71e25a2a', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h8a88b6efbd05', 'golf', '올림픽 골프장', 'gyeonggi', '고양시 덕양구', '경기도 고양시 덕양구 혜음로 301', null, null, 9, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h8a88b6efbd05', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h359360ea2830', 'golf', '용인CC', 'gyeonggi', '용인시 처인구', '경기도 용인시 처인구 백암면 황새울로 255', null, null, 9, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h359360ea2830', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-ha2dba5b80aa4', 'golf', '웰링턴컨트리클럽', 'gyeonggi', '이천시', '경기도 이천시 모가면 사실로 725번길 119-73', null, null, 27, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'ha2dba5b80aa4', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hbad5325f2470', 'golf', '윈체스트 골프클럽 대중', 'gyeonggi', '안성시', '경기도 안성시 서운면 오촌길 97-31', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hbad5325f2470', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-ha8072943109d', 'golf', '은화삼컨트리클럽', 'gyeonggi', '용인시 처인구', '경기도 용인시 처인구 백옥대로 860-38', null, null, 18, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'ha8072943109d', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h852b9665e9d1', 'golf', '이글몬트CC', 'gyeonggi', '안성시', '경기도 안성시 보개면 보삼로 106', null, null, 27, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h852b9665e9d1', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h98856bbdb718', 'golf', '이스트밸리CC', 'gyeonggi', '광주시', '경기도 광주시 곤지암읍 건업길 195', null, null, 27, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h98856bbdb718', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h9cf63239055a', 'golf', '이천실크밸리골프클럽', 'gyeonggi', '이천시', '경기도 이천시 율면 임오산로 296', null, null, 27, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h9cf63239055a', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h27e48da430fc', 'golf', '이포골프장', 'gyeonggi', '여주시', '경기도 여주시 금사면 장흥로 416', null, null, 18, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h27e48da430fc', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h96e4b42adf9e', 'golf', '일동레이크 골프클럽', 'gyeonggi', '포천시', '경기도 포천시 일동면 화동로 738', null, null, 18, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h96e4b42adf9e', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h549940083a22', 'golf', '일동레이크대중제골프장', 'gyeonggi', '포천시', '경기도 포천시 일동면 화동로 738', null, null, 12, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h549940083a22', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h7d9fca1ffa59', 'golf', '일산스프링힐스 컨트리클럽', 'gyeonggi', '고양시 일산동구', '경기도 고양시 일산동구 산황로 108', null, null, 9, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h7d9fca1ffa59', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h5e458cf44b41', 'golf', '자유로컨트리클럽', 'gyeonggi', '연천군', '경기도 연천군 백학면 노아로297번길 179-55', null, null, 27, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h5e458cf44b41', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hf104c3907534', 'golf', '자유컨트리클럽', 'gyeonggi', '여주시', '경기도 여주시 가남읍 자유그린길 69', null, null, 36, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hf104c3907534', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h009b88a7b8bd', 'golf', '제일컨트리클럽', 'gyeonggi', '안산시 상록구', '경기도 안산시 상록구 태마당로28(부곡동)', null, null, 27, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h009b88a7b8bd', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h906db9ea15a3', 'golf', '중부컨트리클럽', 'gyeonggi', '광주시', '경기도 광주시 곤지암읍 경충대로 451', null, null, 18, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h906db9ea15a3', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h7d0dd06fee3e', 'golf', '지산컨트리클럽', 'gyeonggi', '용인시 처인구', '경기도 용인시 처인구 원삼면 죽양대로 2000번길 60', null, null, 27, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h7d0dd06fee3e', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h5340ac6ca691', 'golf', '지산퍼블릭', 'gyeonggi', '용인시 처인구', '경기도 용인시 처인구 원삼면 죽양대로 2100번길 60', null, null, 9, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h5340ac6ca691', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h50c27e57afb4', 'golf', '참밸리 컨트리클럽', 'gyeonggi', '포천시', '경기도 포천시 삼육사로 1982', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h50c27e57afb4', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hb82f36b42111', 'golf', '캐슬렉스골프클럽', 'gyeonggi', '하남시', '경기도 하남시 감이로 317(감이동)', null, null, 18, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hb82f36b42111', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hd68dd3d73a9b', 'golf', '캐슬파인골프클럽', 'gyeonggi', '여주시', '경기도 여주시 강천면 부평로 580', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hd68dd3d73a9b', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h145c9dbbcf37', 'golf', '코리아대중CC', 'gyeonggi', '용인시 기흥구', '경기도 용인시 기흥구 기흥단지로 224', null, null, 9, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h145c9dbbcf37', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h4591fdadadd7', 'golf', '코리아컨트리클럽', 'gyeonggi', '용인시 처인구', '경기도 용인시 처인구 이동읍 기흥단지로 579', null, null, 27, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h4591fdadadd7', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-he234efbfaf70', 'golf', '크리스탈밸리C.C', 'gyeonggi', '가평군', '경기도 가평군 상면 대보간선로 602-111', null, null, 18, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'he234efbfaf70', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hc056aca5ae61', 'golf', '타이거CC 골프장', 'gyeonggi', '파주시', '경기도 파주시 법원읍 술이홀로 1803', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hc056aca5ae61', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hf80facbe5394', 'golf', '태광컨트리클럽(대중제)', 'gyeonggi', '용인시 기흥구', '경기도 용인시 기흥구 흥덕4로 77', null, null, 9, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hf80facbe5394', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h97ad3b29adc8', 'golf', '태광컨트리클럽(회원제)', 'gyeonggi', '용인시 기흥구', '경기도 용인시 기흥구 흥덕4로 77', null, null, 27, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h97ad3b29adc8', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h159c73692fe5', 'golf', '티클라우드컨트리클럽', 'gyeonggi', '동두천시', '경기도 동두천시 평화로 3202', null, null, 18, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h159c73692fe5', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hd2b71058f5f1', 'golf', '파인크리크C.C', 'gyeonggi', '안성시', '경기도 안성시 양성면 안성맞춤대로 2417-13', null, null, 27, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hd2b71058f5f1', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h0ad4940a9e96', 'golf', '파주 J-Public 골프장', 'gyeonggi', '파주시', '경기도 파주시 조리읍 장곡로 100', null, null, 6, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h0ad4940a9e96', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hfdc46244bfbf', 'golf', '파주컨트리클럽', 'gyeonggi', '파주시', '경기도 파주시 법원읍 화합로 306', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hfdc46244bfbf', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h9bdfd8000dae', 'golf', '페럼클럽', 'gyeonggi', '여주시', '경기도 여주시 점동면 점동로 181', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h9bdfd8000dae', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h4b12b89a29e1', 'golf', '포레스트힐 컨트리클럽', 'gyeonggi', '포천시', '경기도 포천시 화현면 봉화로 253', null, null, 24, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h4b12b89a29e1', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h984304992893', 'golf', '포웰CC 안성', 'gyeonggi', '안성시', '경기도 안성시 양성면 약산길 67-6', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h984304992893', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hb22af21a0624', 'golf', '포천아도니스 대중골프장', 'gyeonggi', '포천시', '경기도 포천시 신북면 포천로 2499', null, null, 9, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hb22af21a0624', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h4b4de904b2a5', 'golf', '포천아도니스 C.C', 'gyeonggi', '포천시', '경기도 포천시 신북면 포천로 2499', null, null, 27, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h4b4de904b2a5', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-ha1394dab719e', 'golf', '포천힐스 컨트리클럽', 'gyeonggi', '포천시', '경기도 포천시 군내면 반월산성로 375번길 34', null, null, 27, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'ha1394dab719e', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h3572686b2b57', 'golf', '푸른솔 골프클럽 포천', 'gyeonggi', '포천시', '경기도 포천시 가산면 금우로276', null, null, 27, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h3572686b2b57', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h6b2505a1bfd0', 'golf', '프리스틴밸리 골프클럽', 'gyeonggi', '가평군', '경기도 가평군 설악면 유명로 1243-199', null, null, 18, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h6b2505a1bfd0', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h3d66e853a27c', 'golf', '플라자CC', 'gyeonggi', '용인시 처인구', '경기도 용인시 처인구 남사읍 봉무로 153번길 79', null, null, 36, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h3d66e853a27c', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h5584d7d101d0', 'golf', '필로스 골프클럽', 'gyeonggi', '포천시', '경기도 포천시 일동면 운악청계로 1507', null, null, 27, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h5584d7d101d0', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h4bbd6ac282bb', 'golf', '한림안성', 'gyeonggi', '안성시', '경기도 안성시 양성면 양성로 349-61', null, null, 9, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h4bbd6ac282bb', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h34eaca7d1498', 'golf', '한림용인CC', 'gyeonggi', '용인시 처인구', '경기도 용인시 처인구 남사읍 경기동로 628', null, null, 27, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h34eaca7d1498', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h8d02813d2b4c', 'golf', '한성컨트리클럽', 'gyeonggi', '용인시 기흥구', '경기도 용인시 기흥구 구교동로 151', null, null, 27, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h8d02813d2b4c', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hc961950f58a2', 'golf', '한양컨트리클럽', 'gyeonggi', '고양시 덕양구', '경기도 고양시 덕양구 고양대로1643번길 164', null, null, 36, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hc961950f58a2', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h657fac7d5f8f', 'golf', '한양파인컨트리클럽', 'gyeonggi', '고양시 덕양구', '경기도 고양시 덕양구 고양대로 1591', null, null, 9, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h657fac7d5f8f', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hfd72d715fc0f', 'golf', '한원컨트리클럽', 'gyeonggi', '용인시 처인구', '경기도 용인시 처인구 남사읍 전나무골길2번길 94', null, null, 27, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hfd72d715fc0f', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h98ca0f092fa3', 'golf', '해비치 컨트리클럽', 'gyeonggi', '남양주시', '경기도 남양주시 화도읍 재재기로 190번길 160', null, null, 18, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h98ca0f092fa3', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h0230d9524558', 'golf', '해솔리아 컨트리클럽', 'gyeonggi', '용인시 처인구', '경기도 용인시 처인구 이동읍 백자로 369', null, null, 27, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h0230d9524558', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hc49f6f3819f3', 'golf', '해슬리나인브릿지 컨트리클럽', 'gyeonggi', '여주시', '경기도 여주시 명품1로 76', null, null, 18, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hc49f6f3819f3', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hc4bf7f61e4c8', 'golf', '화산컨트리클럽', 'gyeonggi', '용인시 처인구', '경기도 용인시 처인구 이동읍 화산로 239', null, null, 18, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hc4bf7f61e4c8', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h85fa09d0515b', 'golf', '화성 상록G.C', 'gyeonggi', '화성시', '경기도 화성시 풀무골로60번길 80', null, null, 27, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h85fa09d0515b', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hce280e3222cc', 'golf', '화성골프클럽', 'gyeonggi', '화성시', '경기도 화성시 남양읍 화성로 1393-27', null, null, 9, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hce280e3222cc', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h29837d16f269', 'golf', '힐마루 골프앤리조트 포천', 'gyeonggi', '포천시', '경기도 포천시 영중면 금화봉 4길 77-1', null, null, 45, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h29837d16f269', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h08fe490a60a2', 'golf', 'ROUTE52CC', 'gyeonggi', '여주시', '경기도 여주시 북내면 중암1길 36', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h08fe490a60a2', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hd1c1729aecb6', 'golf', 'YJC골프클럽', 'gyeonggi', '여주시', '경기도 여주시 월평로 78', null, null, 27, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hd1c1729aecb6', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hbc3cf00bbf33', 'golf', '가야컨트리클럽', 'gyeongnam', '김해시', '김해시 인제로 495', null, null, 54, '회원제 · 대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hbc3cf00bbf33', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31'),
    ('mcst-golf-nationwide', 'h3d644eb917f2', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h9e623d9abee5', 'golf', '거제드비치골프클럽', 'gyeongnam', '거제시', '거제시 장목면 거제북로 1573', null, null, 18, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h9e623d9abee5', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-ha1d2c8bc94ce', 'golf', '거제뷰컨트리클럽', 'gyeongnam', '거제시', '거제시 거제면 두동로 259-80', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'ha1d2c8bc94ce', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h0af35ad2e660', 'golf', '거창친환경대중골프장', 'gyeongnam', '거창군', '거창군 가조면 우륵길 410-284', null, null, 9, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h0af35ad2e660', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hc268110d8f37', 'golf', '경남스카이뷰CC', 'gyeongnam', '함양군', '함양군 서상면 소로길 226', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hc268110d8f37', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h9572c08c15c2', 'golf', '고성노벨컨트리클럽', 'gyeongnam', '고성군', '고성군 회화면 회진로 567', null, null, 27, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h9572c08c15c2', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h0a41d4ab8de5', 'golf', '고성컨트리클럽', 'gyeongnam', '고성군', '고성군 고성읍 월평3길 250', null, null, 9, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h0a41d4ab8de5', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h5e310ffd96cd', 'golf', '골프존카운티 경남', 'gyeongnam', '함안군', '함안군 칠원면 운무로 470', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h5e310ffd96cd', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h5471d60069dd', 'golf', '골프존카운티 사천', 'gyeongnam', '사천시', '사천시 서포면 구송로 151', null, null, 27, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h5471d60069dd', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hc7a0c21dbc35', 'golf', '김해상록컨트리클럽', 'gyeongnam', '김해시', '김해시 한림면 김해대로 974번길 198', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hc7a0c21dbc35', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h4c7da2aae4dc', 'golf', '김해정산컨트리클럽', 'gyeongnam', '김해시', '김해시 주촌면 서부로 1637번길 299-194', null, null, 27, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h4c7da2aae4dc', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h3f3791b3dfb3', 'golf', '다이아몬드컨트리클럽', 'gyeongnam', '양산시', '양산시 상북면 공원로 305-391', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h3f3791b3dfb3', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hf89710869dac', 'golf', '동부산컨트리클럽', 'gyeongnam', '양산시', '양산시 매곡외산로 282', null, null, 27, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hf89710869dac', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h85e27a01d489', 'golf', '리더스컨트리클럽', 'gyeongnam', '밀양시', '밀양시 활성로 455', null, null, 27, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h85e27a01d489', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-he5bb0fdb22a4', 'golf', '밀양노벨컨트리클럽', 'gyeongnam', '밀양시', '밀양시 단장면 단장로 946', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'he5bb0fdb22a4', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h2970f4c89b8b', 'golf', '밀양에스파크골프리조트', 'gyeongnam', '밀양시', '밀양시 단장면 미촌리 889', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h2970f4c89b8b', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h848c2a5e2d75', 'golf', '밀양컨트리클럽', 'gyeongnam', '밀양시', '밀양시 부북면 전사포리 832', null, null, 9, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h848c2a5e2d75', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h8e5f45100e80', 'golf', '부곡컨트리클럽', 'gyeongnam', '창녕군', '창녕군 부곡면 온천로 445', null, null, 18, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h8e5f45100e80', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hc28ec90878cd', 'golf', '사우스케이프오너스클럽', 'gyeongnam', '남해군', '남해군 창선면 흥선로 1545', null, null, 18, '비회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hc28ec90878cd', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h7250c31839fa', 'golf', '삼삼컨트리클럽', 'gyeongnam', '사천시', '사천시 축동면 화당산로 224', null, null, 9, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h7250c31839fa', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-ha0109951de8a', 'golf', '서경타니CC', 'gyeongnam', '사천시', '사천시 곤양면 흥신로 210', null, null, 36, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'ha0109951de8a', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31'),
    ('mcst-golf-nationwide', 'hc2819a2dba12', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h90c6a060d600', 'golf', '아난티남해CC', 'gyeongnam', '남해군', '남해군 남면 남서대로 1179번길 40-109', null, null, 9, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h90c6a060d600', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h076dbd3ad5dd', 'golf', '아난티남해GC', 'gyeongnam', '남해군', '남해군 남면 남서대로 1179번길 40-109', null, null, 9, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h076dbd3ad5dd', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h664c79e9ab8f', 'golf', '아델스코트 컨트리클럽', 'gyeongnam', '합천군', '합천군 가야면 가조가야로 1916-35', null, null, 27, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h664c79e9ab8f', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h7f35d7e05145', 'golf', '아라미르골프앤리조트', 'gyeongnam', '창원시 진해구', '창원시 진해구 수제로 36', null, null, 36, '비회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h7f35d7e05145', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hcdb4f8921813', 'golf', '양산동원로얄CC', 'gyeongnam', '양산시', '양산시 어실로 380-45', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hcdb4f8921813', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h33c03db2e498', 'golf', '양산컨트리클럽', 'gyeongnam', '양산시', '양산시 상북면 충렬로 687', null, null, 27, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h33c03db2e498', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-had18be57cf97', 'golf', '에덴밸리컨트리클럽', 'gyeongnam', '양산시', '양산시 원동면 어실로 910', null, null, 18, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'had18be57cf97', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h3f8cc667e229', 'golf', '에이원컨트리클럽', 'gyeongnam', '양산시', '양산시 덕명로 190', null, null, 27, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h3f8cc667e229', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h8aa6f004522c', 'golf', '용원컨트리클럽', 'gyeongnam', '창원시 진해구', '창원시 진해구 가주로 133', null, null, 27, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h8aa6f004522c', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hb2065cf13fd0', 'golf', '의령 리온컨트리클럽', 'gyeongnam', '의령군', '의령군 칠곡면 지굴산로 101-33', null, null, 27, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hb2065cf13fd0', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hfe8c8250e36a', 'golf', '의령친환경골프장', 'gyeongnam', '의령군', '의령군 의령읍 남강로 417', null, null, 9, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hfe8c8250e36a', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hcb214cef0e1d', 'golf', '진주컨트리클럽', 'gyeongnam', '진주시', '진주시 진성면 진성로 464번길 82', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hcb214cef0e1d', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h90159589239c', 'golf', '창원컨트리클럽', 'gyeongnam', '창원시 의창구', '창원시 의창구 대봉로 137', null, null, 18, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h90159589239c', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h3f2bb2db4fab', 'golf', '클럽디거창', 'gyeongnam', '거창군', '거창군 신원면 덕산리 산 13번지', null, null, 27, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h3f2bb2db4fab', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-he1a9ad4b8ac4', 'golf', '통도파인이스트컨트리클럽', 'gyeongnam', '양산시', '양산시 하북면 신평남부길 78-130', null, null, 36, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'he1a9ad4b8ac4', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h79a816230040', 'golf', '통영동원로얄컨트리클럽', 'gyeongnam', '통영시', '통영시 산양읍 담안길 240', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h79a816230040', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h3a13896129b0', 'golf', '포웰CC 김해', 'gyeongnam', '김해시', '김해시 진례면 고모로 134번길 54-49', null, null, 18, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h3a13896129b0', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h63ac925c6451', 'golf', '힐마루컨트리클럽', 'gyeongnam', '창녕군', '창녕군 장마면 영산계성로 469-195', null, null, 36, '회원제 · 대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h63ac925c6451', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31'),
    ('mcst-golf-nationwide', 'h469e5d1523a7', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h1b01b30078d9', 'golf', '강화 선두리 골프장', 'incheon', '강화군', '인천시 강화군 해안남로 474번길 59', null, null, 9, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h1b01b30078d9', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h4932ee43571e', 'golf', '골프존카운티 송도 골프장', 'incheon', '연수구', '인천시 연수구 인천신항대로 1120', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h4932ee43571e', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-heb1a32fede97', 'golf', '드림파크골프장', 'incheon', '서구', '인천시 서구 거월로 61', null, null, 36, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'heb1a32fede97', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-haf65482ce195', 'golf', '베르힐CC 영종', 'incheon', '영종구', '인천시 중구 한상중앙로 66(중산동)', null, null, 36, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'haf65482ce195', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h975c4778a33f', 'golf', '베어즈베스트청라골프클럽', 'incheon', '서구', '인천시 서구 청라대로 316번길 45', null, null, 27, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h975c4778a33f', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-ha508a971c69b', 'golf', '석모도컨트리클럽', 'incheon', '강화군', '인천시 강화군 어류정길 177', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'ha508a971c69b', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h7c4c154de25e', 'golf', '송도골프클럽', 'incheon', '연수구', '인천시 연수구 능허대로 236', null, null, 8, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h7c4c154de25e', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hd64cd902a7bd', 'golf', '오렌지듄스 영종골프클럽', 'incheon', '영종구', '인천시 중구 운서동 2850-43번지 일원', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hd64cd902a7bd', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h03311d712dff', 'golf', '인천국제컨트리클럽', 'incheon', '서구', '인천시 서구 도요지로 37', null, null, 18, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h03311d712dff', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hd71c40086d45', 'golf', '인천그랜드컨트리클럽', 'incheon', '서구', '인천시 서구 원석로 195', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hd71c40086d45', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hbe88f8c347e9', 'golf', '잭 니클라우스 골프클럽 코리아', 'incheon', '연수구', '인천시 연수구 아카데미로 209', null, null, 18, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hbe88f8c347e9', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h49d0c716e0e7', 'golf', '클럽72(바다)', 'incheon', '중구', '인천시 중구 공항동로 392', null, null, 63, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h49d0c716e0e7', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h06aafa6eeb8f', 'golf', '클럽72(하늘)', 'incheon', '중구', '인천시 중구 공항동로135번길 267', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h06aafa6eeb8f', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h7faf29991416', 'golf', '㈜그랜드부민 꿈드림목장', 'jeju', '제주시', '제주특별자치도 제주시 516로 2596-117', null, null, 9, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h7faf29991416', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h995d83ab2f6c', 'golf', '골프존카운티오라', 'jeju', '제주시', '제주특별자치도 제주시 오라남로 130-16', null, null, 36, '회원제 · 대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h995d83ab2f6c', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31'),
    ('mcst-golf-nationwide', 'hd472b06ec5bd', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h60f9dacecbab', 'golf', '그린필드GC', 'jeju', '제주시', '제주특별자치도 제주시 조천읍 번영로 1040-70', null, null, 18, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h60f9dacecbab', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h0082e62e0070', 'golf', '나인브릿지', 'jeju', '서귀포시', '제주특별자치도 서귀포시 안덕면 광평로 34-156', null, null, 24, '회원제 · 대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h0082e62e0070', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31'),
    ('mcst-golf-nationwide', 'h85bf762b0f57', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h3888f593866a', 'golf', '더시에나CC', 'jeju', '제주시', '제주특별자치도 제주시 516로 2695', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h3888f593866a', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hdbb063a8d6c8', 'golf', '더클래식CC', 'jeju', '서귀포시', '제주특별자치도 서귀포시 남원읍 남조로 1105', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hdbb063a8d6c8', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hdba0d2470d37', 'golf', '라온골프클럽', 'jeju', '제주시', '제주특별자치도 제주시 한경면 용금로 998', null, null, 27, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hdba0d2470d37', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hdaa32badf74e', 'golf', '라헨느CC', 'jeju', '제주시', '제주특별자치도 제주시 봉개동 241-13', null, null, 18, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hdaa32badf74e', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h5e4424bd1171', 'golf', '롯데스카이힐제주', 'jeju', '서귀포시', '제주특별자치도 서귀포시 상예로 530', null, null, 36, '회원제 · 대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h5e4424bd1171', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31'),
    ('mcst-golf-nationwide', 'h9ccce145d940', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h88ff67a81e02', 'golf', '볼카노골프앤리조트', 'jeju', '서귀포시', '제주특별자치도 서귀포시 산록남로 1391', null, null, 27, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h88ff67a81e02', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hb1797e2091a6', 'golf', '부영CC', 'jeju', '서귀포시', '제주특별자치도 서귀포시 남원읍 남조로 960', null, null, 27, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hb1797e2091a6', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-haed593fef2a2', 'golf', '블랙스톤제주', 'jeju', '제주시', '제주특별자치도 제주시 한창로 925-122', null, null, 27, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'haed593fef2a2', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31'),
    ('mcst-golf-nationwide', 'h3fb1add65615', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h44c4b5793ffb', 'golf', '사이프러스골프', 'jeju', '서귀포시', '제주특별자치도 서귀포시 번영로 2300', null, null, 36, '회원제 · 대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h44c4b5793ffb', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31'),
    ('mcst-golf-nationwide', 'h63965cb10e08', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h689cf4509b14', 'golf', '샤인빌파크CC', 'jeju', '서귀포시', '제주특별자치도 서귀포시 표선면 가시로 384', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h689cf4509b14', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-he8d245d19b85', 'golf', '서귀포팬텀 골프앤리조트', 'jeju', '서귀포시', '제주특별자치도 서귀포시 산록남로 2914', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'he8d245d19b85', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hf646c5d6f1f5', 'golf', '스프링데일', 'jeju', '서귀포시', '제주특별자치도 서귀포시 남원읍 서성로 459', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hf646c5d6f1f5', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h438e7f565b9e', 'golf', '아난티클럽제주', 'jeju', '제주시', '제주특별자치도 제주시 선유로 445-55', null, null, 36, '회원제 · 대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h438e7f565b9e', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31'),
    ('mcst-golf-nationwide', 'h7e907f67dfb0', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h205d218e4289', 'golf', '아덴힐', 'jeju', '제주시', '제주특별자치도 제주시 화전길 82', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h205d218e4289', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h3f047b51391e', 'golf', '에버리스CC', 'jeju', '제주시', '제주특별자치도 제주시 평화로 1693-75', null, null, 27, '회원제 · 대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h3f047b51391e', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31'),
    ('mcst-golf-nationwide', 'h84431174c34c', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h3e4e3a86d93f', 'golf', '에코랜드', 'jeju', '제주시', '제주특별자치도 제주시 조천읍 번영로 1278-169', null, null, 27, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h3e4e3a86d93f', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-habba1142bf68', 'golf', '엘리시안제주', 'jeju', '제주시', '제주특별자치도 제주시 평화로 1738-116', null, null, 36, '회원제 · 대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'habba1142bf68', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31'),
    ('mcst-golf-nationwide', 'h3ea37b6586f0', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h0b652b15fd83', 'golf', '중문GC', 'jeju', '서귀포시', '제주특별자치도 서귀포시 중문관광로 72번길 60', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h0b652b15fd83', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-haebfecb64767', 'golf', '캐슬렉스제주', 'jeju', '서귀포시', '제주특별자치도 서귀포시 안덕면 평화로 1241', null, null, 27, '회원제 · 대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'haebfecb64767', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31'),
    ('mcst-golf-nationwide', 'h9becce39f0f0', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hc527daba2bc8', 'golf', '크라운CC', 'jeju', '제주시', '제주특별자치도 제주시 조천읍 북선로 125', null, null, 27, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hc527daba2bc8', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hd2e7b1b40132', 'golf', '타미우스cc', 'jeju', '제주시', '제주특별자치도 제주시 애월읍 화전길 201', null, null, 27, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hd2e7b1b40132', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h7ab823ed439c', 'golf', '테디밸리', 'jeju', '서귀포시', '제주특별자치도 서귀포시 한창로 365', null, null, 18, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h7ab823ed439c', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hebb7aa6f1d86', 'golf', '플라자CC', 'jeju', '제주시', '제주특별자치도 제주시 명림로 575-107', null, null, 9, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hebb7aa6f1d86', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-he134786d276b', 'golf', '한라산CC', 'jeju', '제주시', '제주특별자치도 제주시 선돌목동길 56-46', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'he134786d276b', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hcf1c243ee7ac', 'golf', '해비치CC', 'jeju', '서귀포시', '제주특별자치도 서귀포시 남원읍 원님로 399번길 319', null, null, 36, '회원제 · 대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hcf1c243ee7ac', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31'),
    ('mcst-golf-nationwide', 'h4f6513bec095', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h806fb1c58fb6', 'golf', 'SK핀크스', 'jeju', '서귀포시', '제주특별자치도 서귀포시 안덕면 산록남로 863', null, null, 27, '회원제 · 대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h806fb1c58fb6', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31'),
    ('mcst-golf-nationwide', 'h5189323181ef', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-had525f359c17', 'golf', '고창CC', 'jeonbuk', '고창군', '전북특별자치도 고창군 심원면 애향갯벌로 70', null, null, 21, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'had525f359c17', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hb67e68ac9501', 'golf', '골프존 카운티 드래곤', 'jeonbuk', '남원시', '전북특별자치도 남원시 대산면 대사로 498', null, null, 27, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hb67e68ac9501', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31'),
    ('mcst-golf-nationwide', 'h20b4f981e0dc', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h4d1798f849cc', 'golf', '골프존카운티무주', 'jeonbuk', '무주군', '전북특별자치도 무주군 안성면 장무로 1537-21', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h4d1798f849cc', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hf23fba8198c1', 'golf', '골프존카운티선운', 'jeonbuk', '고창군', '전북특별자치도 고창군 아산면 운곡로 418', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hf23fba8198c1', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hec3f3234c64b', 'golf', '군산CC', 'jeonbuk', '군산시', '전북특별자치도 군산시 옥서면 남산군로 1685', null, null, null, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hec3f3234c64b', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h9004d6c65130', 'golf', '금과골프장', 'jeonbuk', '순창군', '전북특별자치도 순창군 금과면 담순로 716', null, null, 6, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h9004d6c65130', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hebd2cd2474d9', 'golf', '김제스파힐스CC', 'jeonbuk', '김제시', '전북특별자치도 김제시 온천길 37', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hebd2cd2474d9', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hccc94e298304', 'golf', '남원상록골프장', 'jeonbuk', '남원시', '전북특별자치도 남원시 대산면 월계길 11', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hccc94e298304', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h9ad0626bf4a3', 'golf', '내장산골프&리조트', 'jeonbuk', '정읍시', '전북특별자치도 정읍시 첨단과학로 476', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h9ad0626bf4a3', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h747f8acbfbb3', 'golf', '더나인골프클럽', 'jeonbuk', '김제시', '전북특별자치도 김제시 금구면 대화1길 8-75', null, null, 9, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h747f8acbfbb3', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hd59223e39858', 'golf', '디케이레저', 'jeonbuk', '순창군', '전북특별자치도 순창군 순창읍 금산로 152', null, null, 9, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hd59223e39858', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h66b502c707c6', 'golf', '무주덕유산CC', 'jeonbuk', '무주군', '전북특별자치도 무주군 설천면 만선로 185', null, null, 18, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h66b502c707c6', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h13c71e5ca023', 'golf', '상떼힐CC', 'jeonbuk', '익산시', '전북특별자치도 익산시 무왕로38길 111', null, null, 6, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h13c71e5ca023', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h54dd5fb3bcaf', 'golf', '석정힐CC', 'jeonbuk', '고창군', '전북특별자치도 고창군 고창읍 석정2로 192', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h54dd5fb3bcaf', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h042790c49f38', 'golf', '써미트CC', 'jeonbuk', '진안군', '전북특별자치도 진안군 부귀면 부귀로 72-161', null, null, 27, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h042790c49f38', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-had0efcdb83b2', 'golf', '아네스빌CC', 'jeonbuk', '김제시', '전북특별자치도 김제시 황산면 높은메길 160-39', null, null, 9, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'had0efcdb83b2', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h08975f025cd0', 'golf', '에스페란사GC', 'jeonbuk', '김제시', '전북특별자치도 김제시 금구면 낙산로 120', null, null, 9, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h08975f025cd0', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h5197db74d0de', 'golf', '웅포컨트리클럽', 'jeonbuk', '익산시', '전북특별자치도 익산시 웅포면 강변로 130', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h5197db74d0de', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h0b8e43486491', 'golf', '익산컨트리클럽', 'jeonbuk', '익산시', '전북특별자치도 익산시 무왕로38길 111', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h0b8e43486491', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h5515903b6e94', 'golf', '장수골프리조트', 'jeonbuk', '장수군', '전북특별자치도 장수군 계남면 장안산로 303', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h5515903b6e94', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h2163ed927957', 'golf', '전주샹그릴라CC', 'jeonbuk', '임실군', '전북특별자치도 임실군 신덕면 수지로 559-90', null, null, 27, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h2163ed927957', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h15a965288a24', 'golf', '전주월드컵골프장', 'jeonbuk', '전주시 덕진구', '전북특별자치도 전주시 덕진구 온고을로 672', null, null, 9, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h15a965288a24', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h55dac531cf4e', 'golf', '케이밸리컨트리클럽', 'jeonbuk', '완주군', '전북특별자치도 완주군 운주면 산북리 65-4', null, null, 9, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h55dac531cf4e', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h45338a68221d', 'golf', '태인CC', 'jeonbuk', '정읍시', '전북특별자치도 정읍시 태인면 상증길 28', null, null, 27, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h45338a68221d', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31'),
    ('mcst-golf-nationwide', 'h25587bfb26a5', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h8ebf87f12917', 'golf', '포세븐금강컨트리클럽', 'jeonbuk', '익산시', '전북특별자치도 익산시 웅포면 강변로 130', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h8ebf87f12917', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h17b6546af196', 'golf', 'OKCC', 'jeonbuk', '완주군', '전북특별자치도 완주군 소양면 화심리 300', null, null, 9, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h17b6546af196', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hb552c62e567f', 'golf', '골드레이크CC', 'jeonnam', '나주시', '전남 나주시 남평읍 나주호로 442-129', null, null, 36, '대중제 · 회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hb552c62e567f', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31'),
    ('mcst-golf-nationwide', 'hbccdd5d20e69', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h588df3b6e856', 'golf', '골프존카운티', 'jeonnam', '순천시', '전남 순천시 주암면 행정1길 77', null, null, 36, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h588df3b6e856', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h763cc07f06a1', 'golf', '골프존카운티 영암', 'jeonnam', '영암군', '영암군 삼호읍 에프원로 121-1', null, null, 45, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h763cc07f06a1', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hab10a50bd667', 'golf', '광양CC', 'jeonnam', '광양시', '전남 광양시 가야로 223', null, null, 6, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hab10a50bd667', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h12731521dcad', 'golf', '광주CC', 'jeonnam', '곡성군', '전남 곡성군 옥과면 입면로 455', null, null, 27, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h12731521dcad', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hb9e1f6153555', 'golf', '나주힐스CC', 'jeonnam', '나주시', '전남 나주시 공산면 삼방신포길 160-27', null, null, 9, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hb9e1f6153555', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h542c294c77eb', 'golf', '나주CC', 'jeonnam', '나주시', '전남 나주시 공산면 상방신포길 154-32', null, null, 9, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h542c294c77eb', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h66ba6f937639', 'golf', '다산베아채골프&리조트', 'jeonnam', '강진군', '전남 강진군 도암면 학장용산길 101', null, null, 27, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h66ba6f937639', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hec4795447423', 'golf', '디오션CC', 'jeonnam', '여수시', '전남 여수시 화양면 안포리 1917', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hec4795447423', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h62d9c29f0eb8', 'golf', '레이나CC', 'jeonnam', '담양군', '전남 담양군 담양읍 깊은실길 169', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h62d9c29f0eb8', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hef99845d4771', 'golf', '르오네뜨CC', 'jeonnam', '곡성군', '전남 곡성군 오산면 오산로 819-126', null, null, 9, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hef99845d4771', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-ha64eb61aebdd', 'golf', '무등산CC', 'jeonnam', '화순군', '전남 화순군 화순읍 오성로 292-90', null, null, 27, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'ha64eb61aebdd', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h4f66166ef1a5', 'golf', '무안CC', 'jeonnam', '무안군', '전남 무안군 청계면 도대리 818', null, null, 54, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h4f66166ef1a5', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hc0a68cb24d8e', 'golf', '백양우리CC', 'jeonnam', '장성군', '전남 장성군 북이면 사거리 752-1', null, null, 9, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hc0a68cb24d8e', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h6ac5f8a6946a', 'golf', '베르힐컨트리클럽', 'jeonnam', '함평군', '전남 함평군 대동면 대동길 408', null, null, 27, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h6ac5f8a6946a', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h4568a8d2b946', 'golf', '보성에덴CC', 'jeonnam', '보성군', '전남 보성군 보성읍 쾌상리 1385', null, null, 9, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h4568a8d2b946', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h7c33d1b84485', 'golf', '보성CC', 'jeonnam', '보성군', '전남 보성군 조성면 대곡리 1117', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h7c33d1b84485', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h1eb317055975', 'golf', '세이지우드 여수경도', 'jeonnam', '여수시', '전남 여수시 대경도길 111', null, null, 27, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h1eb317055975', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h530ef902ac79', 'golf', '솔라시도CC', 'jeonnam', '해남군', '해남군 산이면 산이로 2247', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h530ef902ac79', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-ha1eb7f06f053', 'golf', '순천부영CC', 'jeonnam', '순천시', '전남 순천시 해룡면 신대로 188', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'ha1eb7f06f053', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h7e6fe26b71f8', 'golf', '순천CC', 'jeonnam', '순천시', '전남 순천시 별량면 동화사길 85', null, null, 9, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h7e6fe26b71f8', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h13b877e91039', 'golf', '아크로CC', 'jeonnam', '영암군', '전남 영암군 금정면 안적동길 403', null, null, 27, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h13b877e91039', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h58173f7bf757', 'golf', '에콜리안영광골프장', 'jeonnam', '영광군', '영광군 영광읍 월현로 1길 40', null, null, 9, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h58173f7bf757', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hc2339ec701be', 'golf', '엘리체CC', 'jeonnam', '화순군', '전남 화순군 춘양면 장곡길 55', null, null, 18, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hc2339ec701be', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h672b22349b63', 'golf', '엘리체CC', 'jeonnam', '함평군', '전남 함평군 학교면 서당매길 242', null, null, 27, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h672b22349b63', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hf089598283f6', 'golf', '여수시티파크골프&호텔', 'jeonnam', '여수시', '전남 여수시 좌수영로 641', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hf089598283f6', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hc3e3cfe1e059', 'golf', '오시아노골프클럽', 'jeonnam', '해남군', '해남군 화원면 시아로 224', null, null, 9, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hc3e3cfe1e059', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h7d8039eb7c4e', 'golf', '옥과기안CC', 'jeonnam', '곡성군', '전남 곡성군 옥과면 소룡리 427-2', null, null, 9, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h7d8039eb7c4e', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h8e20115075c4', 'golf', '웨스트오션CC', 'jeonnam', '영광군', '영광군 백수읍 해안로 1362-70', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h8e20115075c4', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h2f061dfbc273', 'golf', '조아밸리CC', 'jeonnam', '화순군', '전남 화순군 도곡면 고인돌2로 450', null, null, 9, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h2f061dfbc273', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-ha3ed3183ac5b', 'golf', '죽향CC', 'jeonnam', '담양군', '전남 담양군 창평면 창평로 159', null, null, 9, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'ha3ed3183ac5b', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h7900db413ea9', 'golf', '창평CC', 'jeonnam', '담양군', '전남 담양군 창평면 오강리 27-2', null, null, 9, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h7900db413ea9', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-ha9e909a664d1', 'golf', '천지CC', 'jeonnam', '함평군', '전남 함평군 함장로 889-11', null, null, 9, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'ha9e909a664d1', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h93f5411e4b28', 'golf', '클린밸리CC', 'jeonnam', '무안군', '전남 무안군 청계면 태봉길 33-100', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h93f5411e4b28', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-he90ebb1c0f85', 'golf', '파인비치골프링크스', 'jeonnam', '해남군', '해남군 화원면 시아로 224', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'he90ebb1c0f85', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hf201f9e88b3c', 'golf', '파인힐스CC', 'jeonnam', '순천시', '전남 순천시 주암면 송강사길 99', null, null, 27, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hf201f9e88b3c', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hc6499dd40feb', 'golf', '포라이즌', 'jeonnam', '순천시', '전남 순천시 별량면 오실길 333', null, null, 27, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hc6499dd40feb', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hfe0b4ad606df', 'golf', '푸른솔 골프클럽', 'jeonnam', '장성군', '전남 장성군 동화면 임정로 155', null, null, 27, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hfe0b4ad606df', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h6259171dca25', 'golf', '해피니스CC', 'jeonnam', '나주시', '전남 나주시 다도면 다도로 171-60', null, null, 36, '대중제 · 회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h6259171dca25', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31'),
    ('mcst-golf-nationwide', 'hd233cd9d7c76', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h5737cb7ccd36', 'golf', '화순CC', 'jeonnam', '화순군', '전남 화순군 도곡면 천태로 1000-151', null, null, 27, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h5737cb7ccd36', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h75bd4c9278c8', 'golf', 'cosmos 1', 'jeonnam', '영암군', '영암군 삼호읍 에프원로 121-4', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h75bd4c9278c8', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h73f56bdb7dea', 'golf', 'JNJ골프리조트', 'jeonnam', '장흥군', '장흥군 장평면 제산기동로 326', null, null, 27, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h73f56bdb7dea', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-hd62a275b119a', 'golf', '건설공제조합세종필드골프클럽', 'sejong', null, '세종특별자치시 정안세종로 1569', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'hd62a275b119a', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h9c177e830af6', 'golf', '세종레이캐슬골프&리조트', 'sejong', null, '세종특별자치시 전의면 의당전의로 252', null, null, 27, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h9c177e830af6', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h72e5afccd645', 'golf', '세종에머슨컨트리클럽', 'sejong', null, '세종특별자치시 전의면 운주산로 1510', null, null, 27, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h72e5afccd645', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h3dc2c67a410a', 'golf', '인서울27골프클럽', 'seoul', '강서구', '서울특별시 강서구 오정로 443-198', null, null, 27, '비회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h3dc2c67a410a', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h15e90bd4dd2a', 'golf', '더골프골프장', 'ulsan', '울주군', '울주군 서생면 용연길 206-52', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h15e90bd4dd2a', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h908f441cde6d', 'golf', '베이스타즈CC', 'ulsan', '북구', '북구 미포산업로 800', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h908f441cde6d', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h735aff323648', 'golf', '보라골프장', 'ulsan', '울주군', '울주군 삼동면 삼동로 404', null, null, 27, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h735aff323648', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-he1bc05a20eaa', 'golf', '삼남골프장', 'ulsan', '울주군', '울주군 삼남면 방기가천로 179', null, null, 9, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'he1bc05a20eaa', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h3fc50746dbd2', 'golf', '오르비스골프클럽', 'ulsan', '울주군', '울주군 온양읍 망양리 산14-9', null, null, 18, '대중제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h3fc50746dbd2', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

with up as (
  insert into course (slug, kind, name, region, gu, addr, addr_road, tel, holes, biz_kind, site_url, lat, lng, state)
  values ('mcst-golf-nationwide-h132d3aa0d9d6', 'golf', '울산골프장', 'ulsan', '울주군', '울주군 웅촌면 웅촌로 1', null, null, 27, '회원제', null, null, null, 'open')
  on conflict (lower(slug)) do update set
    name = excluded.name, region = excluded.region, gu = excluded.gu,
    addr = excluded.addr, addr_road = excluded.addr_road, tel = excluded.tel,
    holes = excluded.holes, biz_kind = excluded.biz_kind,
    site_url = coalesce(nullif(excluded.site_url, ''), course.site_url),
    lat = excluded.lat, lng = excluded.lng,
    state = case when course.state = 'hidden' then course.state else excluded.state end,
    updated_at = now()
  returning id)
insert into course_source (course_id, source_id, src_key, status_raw, as_of)
select up.id, v.source_id, v.src_key, v.status_raw, v.as_of::date from up, (values
    ('mcst-golf-nationwide', 'h132d3aa0d9d6', '현황 등재 — 문체부가 「운영 중인 골프장」 현황으로 공표한 목록 (영업상태 칸 없음 · 기준일 이후 폐업 여부는 미확인)', '2024-12-31')
  ) v(source_id, src_key, status_raw, as_of)
on conflict (source_id, src_key) where src_key is not null do update set
  status_raw = excluded.status_raw, as_of = excluded.as_of;

commit;

-- 넣은 뒤 확인
select kind, state, count(*) from course group by 1, 2 order by 1, 2;