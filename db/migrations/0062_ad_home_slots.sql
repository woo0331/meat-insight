-- ════════════════════════════════════════════════════════════════════
-- 0062 — 메인 광고 자리 넷 (지시서 B)
--
-- ⚠️⚠️ **키는 더하기만 합니다.** `ad_run.place` 가 이 enum 을 글자로
--   들고 있어서, 이름을 바꾸면 이미 들어간 광고가 갈 곳을 잃습니다.
--   그래서 지시서의 네 자리를 이렇게 맞춥니다 —
--     HOME_PREMIUM    → **`main_hero`** (이미 있습니다 · 같은 자리입니다)
--     HOME_SPONSOR_A  → `home_sponsor_a`   (새로)
--     HOME_SPONSOR_B  → `home_sponsor_b`   (새로)
--     HOME_BOTTOM     → `home_bottom`      (새로)
--   `main_band`(메인 가운데 띠)는 그대로 둡니다 — 쓰고 있는 자리입니다.
--
-- ⚠️⚠️⚠️ **`alter type … add value` 는 같은 트랜잭션 안에서 그 값을
--   쓸 수 없습니다.** 여기서는 더하기만 하고 쓰지 않으므로 괜찮습니다.
--   뒤에서 이 값으로 줄을 넣는 SQL 을 같은 파일에 적지 마세요.
--
-- ⚠️ `check-deal` 이 `create type` 과 `alter type … add value` 를 **합쳐서**
--   화면의 `AM_AD_PLACE` 와 맞춰 봅니다 — 한쪽만 고치면 빌드가 멈춥니다.
--
-- 되돌아갔는지 보는 법:
--   select unnest(enum_range(null::ad_place));
--   → home_sponsor_a · home_sponsor_b · home_bottom 셋이 보이면 올라간 것입니다.
-- ════════════════════════════════════════════════════════════════════
begin;

alter type ad_place add value if not exists 'home_sponsor_a';
alter type ad_place add value if not exists 'home_sponsor_b';
alter type ad_place add value if not exists 'home_bottom';

commit;
