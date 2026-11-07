-- ════════════════════════════════════════════════════════════════════
-- 0032 — 업체 목록을 **가져올 길**을 엽니다 (그리고 광고 보기의 구멍 하나)
-- ════════════════════════════════════════════════════════════════════
-- ⚠️⚠️⚠️ **`tools/pull-providers.js` 는 지금까지 한 번도 돌 수 없었습니다.**
--   그 도구는 공개 키(anon)로 `provider` 표를 읽습니다. 그런데 0001 의
--   GRANT 는 **anon 에게 select 를 한 줄도 주지 않습니다** (452~456행 —
--   "anon 에게는 아무 권한도 주지 않습니다"). RLS 의 `provider_public`
--   정책만 보고 "공개 목록은 읽힌다" 고 읽었는데, **GRANT 가 먼저**
--   막습니다 — `permission denied for table provider` 입니다.
--
--   업체가 0곳인 동안은 아무도 그 도구를 돌릴 까닭이 없어서 몰랐습니다.
--   **첫 업체를 승인하신 날** 그때 처음 터질 참이었고, 그날은 손님에게
--   업체를 보여 드리려는 날입니다. 0030 의 검사를 쓰면서 anon 으로
--   눌러 보다 알았습니다 (자물쇠가 **겹쳐 있어** 정책만 보고 통과로
--   읽은 자리 — 작업 기억의 "GRANT 와 RLS 를 따로 눌러 보세요").
--
-- ⚠️⚠️ **표를 anon 에게 열지 않습니다.** `grant select on provider to anon`
--   한 줄로 끝낼 수도 있지만, 그러면 **칸 전부**가 열립니다 —
--   `assignable`(제휴 계약이 되어 있는가) · `listed` · `is_test` 까지
--   누구나 읽습니다. 그건 손님 화면에 쓰지 않는 운영 정보입니다.
--   그래서 **칸을 골라 담은 보기(view)** 하나만 엽니다.
--
-- ⚠️⚠️ **보기는 RLS 를 지나지 않습니다** (security_invoker 를 안 켰으니
--   임자 권한으로 돕니다). 그러니 **보기의 where 절이 자물쇠 그 자체**
--   입니다 — 0030 의 정책과 **다른 자리에 있는 둘째 자물쇠**이고,
--   한쪽이 내려가도 다른 쪽이 남습니다. 칸을 더하실 때 이 줄을 꼭
--   다시 읽으세요.
--
-- ⚠️ `is_test` 를 **일부러 담았습니다.** 보기의 where 가 늘 false 로
--   좁히니 쓸모없어 보이지만, `tools/pull-providers.js` 가 그 값을
--   다시 봅니다 — where 가 느슨해지는 날 도구가 멈춥니다.
--
-- ⚠️⚠️ **광고 보기(v_ad_live)에 구멍이 하나 있었습니다.** 그 보기는
--   `provider` 를 join 해서 상호를 내보내고 anon 에게 열려 있는데,
--   보기는 RLS 를 지나지 않으므로 **검사용 업체의 상호가 광고로 나갈**
--   수 있었습니다 (0030 의 정책이 그 길은 못 막습니다). 같이 좁힙니다.
-- ════════════════════════════════════════════════════════════════════
begin;

-- ── ① 공개용 업체 보기 ──────────────────────────────────────────────
-- ⚠️⚠️ **연락처 · 담당자 칸이 여기 없습니다** (그 자료는 0013 의
--   `provider_contact` 에 따로 있고, 운영자만 봅니다). 이 보기에
--   사람 정보를 담지 마세요 — anon 에게 열린 자리입니다.
-- ⚠️ `assignable` 도 담지 않습니다 — 어느 업체와 계약이 되어 있는지는
--   손님 화면에 쓸 일이 없습니다.
-- ⚠️⚠️⚠️ **보기는 `create or replace` 로 칸을 못 늘립니다.** 뒤 번호가
--   이 보기에 칸을 하나 더하면(0044 가 `contact_ways` 를 더했습니다),
--   사장님이 붙여넣기 파일을 **두 번째로** 붙여 넣는 날 이 줄에서
--   `cannot drop columns from view` 로 멈춥니다 — 앞쪽 파일이 옛 칸
--   목록으로 다시 만들려 하기 때문입니다.
--   ⚠️ 그래서 **지우고 다시 만듭니다.** 지우면 GRANT 도 같이 날아가므로
--   바로 아래에서 다시 줍니다 (안 주면 anon 이 못 읽어 그날부터
--   `tools/pull-providers.js` 가 permission denied 입니다).
--   ⚠️⚠️ 이 줄을 고친 까닭 — 운영 DB 는 아직 0007 까지만 올라가 있어
--   **이 파일이 운영에서 한 번도 돈 적이 없습니다.** 이미 돌린 파일이면
--   고치지 않고 새 번호로 갔을 것입니다 (작업 기억의 그 규칙).
--   `tools/test-upgrade.js` 의 ⑧ 이 "두 번 붙여 넣어도 끝까지 도는가" 를
--   실제로 돌려 봅니다.
drop view if exists v_provider_card;
create view v_provider_card as
  select p.id, p.name, p.intro, p.regions, p.gu, p.subs, p.since,
         p.consult_hours, p.verified, p.brands, p.scale,
         p.is_test       -- ⚠️ 늘 false 입니다 (아래 where) — 도구가 다시 봅니다
    from provider p
   where p.listed = true
     and p.is_test = false;

comment on view v_provider_card is
  '손님 화면 · tools/pull-providers.js 가 읽는 공개 업체 목록. '
  'RLS 를 지나지 않으므로 where 절이 자물쇠입니다 (0032).';

grant select on v_provider_card to anon, authenticated;


-- ── ② 광고 보기에서도 검사용을 거릅니다 ────────────────────────────
-- ⚠️⚠️ 0026 의 보기를 **덮어씁니다.** 0026 을 다시 붙여 넣으면 이것이
--   내려가고 검사용 업체의 상호가 광고로 나갈 수 있습니다. 내려갔는지는
--   이렇게 봅니다:
--     select definition like '%is_test%' from pg_views where viewname='v_ad_live';
--   false 면 0026 판입니다. 이 파일을 다시 올리세요.
-- ⚠️ 칸 목록과 차례는 0026 것 **그대로**입니다 — 이 파일은 `is_test`
--   한 줄만 더합니다. 칸을 늘리는 것은 0064 이고, 그 때문에 아래가
--   `drop view` + `create view` 로 바뀌었습니다 (바로 아래 머리말).
-- ⚠️⚠️ `label` 을 **그대로 둡니다.** 광고를 광고라고 적지 않으면
--   표시 · 광고의 공정화에 관한 법률 제3조입니다.
-- ⚠️⚠️⚠️ **`create or replace view` 가 아니라 지우고 다시 만듭니다.**
--   0064 가 이 보기에 칸 다섯(소재 · 클릭 주소 · 광고주)을 더했는데,
--   여기가 `create or replace` 이면 사장님이 붙여넣기 파일을 **두 번째로**
--   붙여 넣는 날 이 줄에서 `cannot drop columns from view` 로 **멈춥니다**
--   — 앞쪽 파일이 **옛 칸 목록**으로 다시 만들려 하기 때문입니다.
--   0044 가 `v_provider_card` 에서 겪은 그 자리이고, `test-upgrade` 의
--   ⑧("두 번 붙여 넣어도 끝까지 도는가")이 잡았습니다.
--   ⚠️ 지우면 **GRANT 도 같이 날아가므로** 바로 아래에서 다시 줍니다
--   (안 주면 그날부터 손님 화면에 광고가 한 줄도 안 나옵니다).
--   ⚠️⚠️ 이 줄을 고친 까닭 — 운영 DB 는 아직 **0007 까지만** 올라가 있어
--   이 파일이 운영에서 한 번도 돈 적이 없습니다. 이미 돌린 파일이면
--   고치지 않고 새 번호로 갔을 것입니다 (작업 기억의 그 규칙).
drop view if exists v_ad_live;
create view v_ad_live as
  select a.id, a.provider_id, p.name as provider_name,
         a.place, a.cat_key, a.region, a.starts_on, a.ends_on,
         '광고'::text as label
    from ad_run a join provider p on p.id = a.provider_id
   where a.state = 'live'
     and current_date between a.starts_on and a.ends_on
     and p.is_test = false;

-- ⚠️ 지우면 권한도 같이 날아갑니다 — 바로 다시 줍니다
--   (안 주면 그날부터 손님 화면에 광고가 한 줄도 안 나옵니다).
grant select on v_ad_live to anon, authenticated;

insert into schema_version (n, name) values (32, '0032_provider_card_view')
on conflict (n) do nothing;

commit;
