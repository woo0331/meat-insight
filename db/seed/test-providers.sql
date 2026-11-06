-- ════════════════════════════════════════════════════════════════════
-- 검사용 업체 **셋** — 상담 → 배정 → 견적 → 고르기를 눌러 보려고
-- ════════════════════════════════════════════════════════════════════
-- ⚠️⚠️ **마이그레이션이 아닙니다.** `db/migrations` 에 두지 않았고
--   `db/apply-from-0008.sql` 에도 안 들어갑니다 — 운영 DB 를 올리는
--   날 검사용 업체가 **같이 올라가면 안 됩니다.** 붙여 넣는 것은
--   눌러 보실 때, 손으로 한 번뿐입니다.
--
-- ⚠️⚠️ **여기 적힌 셋은 실제로 있는 회사가 아닙니다.** 이름 앞에
--   `[검사용]` 을 붙이고 `is_test = true` 를 켭니다. 손님 쪽으로 가는
--   길이 **세 겹으로** 막힙니다 —
--     ① 0030 의 공개 정책 (`provider_public`)      로그인한 사람
--     ② 0032 의 공개 보기 (`v_provider_card`)       비로그인 · 빌드
--     ③ `tools/pull-providers.js` 가 다시 한 번
--   그래서 손님 화면 · 분류 화면 · 사이트맵 · 광고 띠 · 크롤러에게
--   **한 줄도 안 나갑니다.**
--   ⚠️ 그래도 `[검사용]` 을 이름에 박아 두는 까닭은, 누군가 0030 을
--   안 올린 DB 에 이 파일만 붙여 넣는 날 **이름이 스스로 말하게**
--   하려는 것입니다.
--
-- ⚠️⚠️ **연락처 · 성함을 넣지 않습니다.** 지어낸 사람 정보를 표에
--   쌓지 않습니다 — `provider_contact`(0013)는 비워 둡니다.
--
-- ── 차례 ────────────────────────────────────────────────────────────
--   0  db/apply-from-0008.sql 을 먼저 돌려 두셔야 합니다 (0030 포함).
--      ⚠️ 0030 이 없으면 `is_test` 칸이 없어서 그 자리에서 멈춥니다 —
--         그게 맞습니다. 칸 없이 넣으면 그 줄이 공개됩니다.
--   1  이 파일의 **① 업체**를 붙여 넣습니다.
--   2  검사용 업체로 쓰실 계정으로 **한 번 로그인**하십니다
--      (/login — 메일 링크). 로그인해야 auth.users 에 줄이 생깁니다.
--   3  ② 의 계정 잇기를 그 사람의 User UID 로 고쳐 돌립니다.
--      ⚠️ 화면에서 역할을 올릴 길은 없습니다 (0021 의 자물쇠).
--   4  ③ 의 update 를 돌려 **배정 가능**을 켭니다.
--      ⚠️ `assignable` 은 계정이 이어진 뒤에만 켜집니다 (0018 의 ②) —
--         안 이으셨으면 그 자리에서 사람 말로 거절합니다.
--   5  /match 에서 요청을 하나 넣고, /admin 에서 배정하고,
--      /desk 에서 견적을 냅니다.
--
-- ── 지울 때 ─────────────────────────────────────────────────────────
--   파일 끝의 ④ 를 돌립니다. ⚠️ 배정 · 견적이 `on delete cascade` 로
--   같이 지워집니다 — 검사로 만든 것만 지우는 것이 맞지만, **참
--   손님의 요청에 검사용 업체를 배정하신 적이 있으면 그 배정도
--   같이 사라집니다.** 그런 일이 있었는지 먼저 세어 보십니다
--   (④ 의 첫 질의).
-- ════════════════════════════════════════════════════════════════════


-- ── ① 업체 셋 ───────────────────────────────────────────────────────
-- ⚠️ `subs` 는 `js/data/catalog.js` 의 **하위 키**입니다. 분류 키를
--   적으면 그 업체만 조용히 아무 데도 안 뜹니다 (빌드 가드가 잡습니다).
-- ⚠️ `assignable` 은 **false 로 넣습니다** — 계정이 이어지기 전에
--   true 로 넣으면 0018 의 트리거가 거절합니다 (그게 맞습니다).
-- ⚠️⚠️ `verified` 를 **비워 둡니다.** 확인 배지는 서류를 본 뒤에만
--   켜는 것이고, 검사용 업체의 서류는 본 적이 없습니다 (절대 규칙 1).
-- ⚠️⚠️ 0057 — 사업자 신원정보(제20조 제2항)를 **두 곳만** 채웁니다.
--   세 곳 다 채우면 "아직 등록되지 않았습니다" 갈래를 아무도 안 눌러
--   보게 됩니다 — 그 갈래가 손님에게 보이는 글이라 같이 재야 합니다.
--   ⚠️ 번호는 **000-00-00000** 입니다 — 실재하지 않는 꼴이고, 이 업체는
--   `is_test = true` 라 손님 화면에 한 줄도 안 나갑니다 (0030 · 0032).
insert into provider (id, name, intro, regions, gu, subs, since,
                      consult_hours, scale, brands,
                      ceo, addr, tel, email, brn,
                      listed, assignable, is_test)
values
  ('t-range', '[검사용] 남서울 실내연습장',
   '검사용으로 만든 업체입니다. 실제로 있는 회사가 아닙니다.',
   array['seoul'], array['관악구'],
   array['rg-in','rg-sim','ls-solo'], 2020,
   '평일 09:00~22:00', 'mid', array['타이틀리스트'],
   '검사용대표', '서울 관악구 (검사용 주소)', '02-0000-0000',
   'range@example.com', '000-00-00000',
   true, false, true),

  ('t-fit', '[검사용] 그린피팅 스튜디오',
   '검사용으로 만든 업체입니다. 실제로 있는 회사가 아닙니다.',
   array['gyeonggi'], array['성남시 분당구'],
   array['ft-driver','ft-shaft','ft-grip'], 2018,
   '화~일 11:00~20:00', 'small', array['캘러웨이','타이틀리스트'],
   '검사용대표', '경기 성남시 분당구 (검사용 주소)', '031-000-0000',
   'fit@example.com', '000-00-00001',
   true, false, true),

  ('t-tour', '[검사용] 올인원골프투어',
   '검사용으로 만든 업체입니다. 실제로 있는 회사가 아닙니다.',
   array['seoul'], array['강남구'],
   array['tr-home','tr-away','tr-pack'], 2015,
   '평일 10:00~19:00', 'large', '{}'::text[],
   -- ⚠️ 이 한 곳은 **비워 둡니다** — 업체 화면의 "사업자 정보가 아직
   --   등록되지 않았습니다" 갈래를 검사가 눌러 볼 수 있게.
   null, null, null, null, null,
   true, false, true)
on conflict (id) do update set
  name       = excluded.name,
  intro      = excluded.intro,
  regions    = excluded.regions,
  gu         = excluded.gu,
  subs       = excluded.subs,
  since      = excluded.since,
  consult_hours = excluded.consult_hours,
  scale      = excluded.scale,
  brands     = excluded.brands,
  -- ⚠️ 0057 — 같은 값으로 덮습니다. 값이 그대로면 `is distinct from` 이
  --    거짓이라 `provider_ident_guard` 가 안 걸립니다 (두 번 붙여 넣어도
  --    멈추지 않습니다 — `listed` 와 같은 자리입니다).
  ceo        = excluded.ceo,
  addr       = excluded.addr,
  tel        = excluded.tel,
  email      = excluded.email,
  brn        = excluded.brn,
  listed     = excluded.listed,
  -- ⚠️ `assignable` 을 되돌리지 않습니다 — 이미 켜 두셨으면 그대로
  --    둡니다 (두 번 붙여 넣어도 ③ 을 다시 하지 않게).
  is_test    = true;

-- ⚠️⚠️ **넣은 뒤에 반드시 세어 보십니다.** 세 줄이 아니면 뭔가
--   다릅니다 (충돌한 줄이 있거나, 0030 이 안 올라갔거나).
select id, name, listed, assignable, is_test
  from provider where is_test = true order by id;


-- ── ② 계정 잇기 — ⚠️ UID 를 **그 사람 것으로** 고쳐 돌리십니다 ─────
-- Supabase → Authentication → Users 에서 User UID 를 복사하십니다.
-- ⚠️⚠️ 아래를 **그대로** 돌리면 아무 일도 안 납니다 (없는 UID 라
--   0줄이 바뀝니다). RLS · update 는 **막혔다고 말해 주지 않습니다** —
--   0줄이 바뀌고 성공으로 돌아옵니다. 그래서 바뀐 줄 수를 보십니다.
--
--   update account
--      set role = 'provider', provider_id = 't-range'
--    where id = '00000000-0000-0000-0000-000000000000';
--   -- UPDATE 1 이 찍혀야 합니다. UPDATE 0 이면 UID 가 틀렸습니다.
--
-- ⚠️ 업체 셋을 다 눌러 보시려면 계정도 셋이 필요합니다 — 한 계정은
--   한 업체에만 이어집니다(`account.provider_id` 한 칸). 하나만
--   이어 두고 그 업체로만 눌러 보셔도 흐름은 같습니다.


-- ── ③ 배정 가능 켜기 ───────────────────────────────────────────────
-- ⚠️⚠️ **`approve_provider()` 를 쓰지 않습니다.** 그 문은 누가 켰는지를
--   감사 기록에 남기려고 `auth.uid()` 를 봅니다. 그런데 **SQL 편집기는
--   로그인한 사람이 아니라 서비스 권한으로 붙어서** `auth.uid()` 가
--   비고, "변경자를 알 수 없습니다" 로 거절합니다. 그게 맞습니다 —
--   ⚠️ **참 업체를 켜실 때는** 그 문으로 켜셔야 합니다 (db/README.md).
--   검사용 셋은 기록에 남길 "누가" 가 없는 줄이라 표를 직접 고칩니다.
--
-- ⚠️ 자물쇠는 그대로 걸립니다 — 계정이 안 이어진 업체는 아래 update 가
--   **사람 말로** 거절합니다 (0018 의 provider_link_guard). 그 글을
--   그대로 읽으시면 ② 를 안 하신 것입니다.
-- ⚠️⚠️ **아래는 주석입니다 — ② 를 마치신 뒤에 벗겨서 돌리십니다.**
--   ①과 같이 돌아가게 두면, 이 파일을 통째로 붙여 넣는 순간 여기서
--   멈춥니다 (그때는 계정이 안 이어져 있으니까요). 검사가 실제로
--   붙여 넣어 보고 알았습니다.
--
--   update provider set assignable = true
--    where id in ('t-range','t-fit','t-tour')
--      and is_test = true;
--
-- ⚠️ `and is_test = true` 를 꼭 같이 적으십니다 — 손이 미끄러져도
--   참 업체는 안 켜집니다.
-- ⚠️⚠️ **바뀐 줄 수를 보십니다.** UPDATE 3 이 아니면 켜지지 않은 것이
--   있습니다. update 는 **막혔다고 말해 주지 않습니다** — 0줄이 바뀌고
--   성공으로 돌아오는 자리가 많습니다.
-- ⚠️ 계정을 **하나만** 이으셨으면 셋을 한 번에 켤 수 없습니다 (안 이어진
--   곳에서 거절하고 **통째로 되돌아갑니다** — 반쯤 켜지지 않습니다).
--   그때는 이은 곳만 켜십니다:
--
--   update provider set assignable = true where id = 't-range' and is_test = true;
--
--   select id, name, listed, assignable, is_test
--     from provider where is_test = true order by id;


-- ── ④ 지울 때 ──────────────────────────────────────────────────────
-- ⚠️⚠️ **먼저 세어 보십니다.** 참 손님의 요청에 검사용 업체를
--   배정한 적이 있으면, 아래 delete 가 그 배정과 견적까지 같이
--   지웁니다 (`on delete cascade`).
--
--   select p.id, count(a.id) as 배정, count(q.id) as 견적
--     from provider p
--     left join assignment a on a.provider_id = p.id
--     left join quote      q on q.provider_id = p.id
--    where p.is_test = true group by p.id;
--
-- ⚠️ 0건이면 그냥 지우십니다. 0건이 아니면 그 요청번호를 먼저
--   적어 두십니다 — 지우면 "그 업체가 무엇을 냈는가" 가 사라집니다.
--
--   delete from provider where is_test = true;
--
-- ⚠️ 이어 두었던 계정의 역할도 되돌리십니다 (안 되돌리면 그 사람이
--   없는 업체의 업체 회원으로 남습니다) —
--   update account set role = 'customer', provider_id = null
--    where provider_id in ('t-range','t-fit','t-tour');
