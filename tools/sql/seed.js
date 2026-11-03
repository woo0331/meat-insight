/* ════════════════════════════════════════════════════════════════════
   사장님이 **붙여 넣으실 파일**을 실제로 붙여 넣어 봅니다
   — `db/seed/test-providers.sql`

   ⚠️⚠️ **적어 둔 차례가 맞는지는 돌려 봐야 압니다.** 이 파일은 코드가
   아니라 **안내문**이라 아무 검사도 안 봅니다 — 처음 쓴 판은 SQL
   편집기에 없는 함수(`become()` — 검사용 흉내)를 돌리라고 적고 있었고,
   사장님이 그대로 하셨으면 "그런 함수가 없습니다" 에서 멈췄을 것입니다.
   그래서 **글이 아니라 파일을 돌려** 봅니다.

   ⚠️ 여기서 재는 것은 **차례와 자물쇠**입니다 —
     ① 업체 셋이 들어가는가 · 검사용으로 찍히는가
     ② 계정을 안 이으면 배정 가능이 **안 켜지는가**
     ③ 이으면 켜지는가 · 몇 줄이 바뀌는가
     ④ 두 번 붙여 넣어도 안전한가 (사장님이 또 붙여 넣으십니다)
   ════════════════════════════════════════════════════════════════════ */
module.exports = function(T){
  const { ok, psql, psqlFile, denied, allowed } = T;

  console.log("\n── db/seed/test-providers.sql 을 **그대로** 붙여 넣어 봅니다");

  /* ⚠️⚠️ **살아 있는 SQL 은 ① 뿐입니다.** ②(계정 잇기)와 ③(배정 가능
     켜기)은 사람 손이 먼저 들어가야 해서 주석으로 두었습니다 —
     ③ 을 살려 두었더니 **파일을 통째로 붙여 넣는 순간 거기서 멈췄고**,
     검사가 실제로 붙여 넣어 보고 알았습니다.
     ⚠️ 그래서 ③ 은 **파일에서 꺼내** 돌려 봅니다. 글과 검사가 어긋나지
     않게, 파일에 그 글자가 실제로 있는지부터 봅니다. */
  const fs2 = require("fs"), path2 = require("path");
  const SEED = fs2.readFileSync(
    path2.join(__dirname, "..", "..", "db", "seed", "test-providers.sql"), "utf8");
  const STEP3 = "update provider set assignable = true\n" +
                "    where id in ('t-range','t-fit','t-tour')\n" +
                "      and is_test = true;";
  const flat = x => x.replace(/^--\s?/gm, "").replace(/\s+/g, " ").trim();
  ok("③ 의 SQL 이 파일에 적힌 그대로다 (글과 검사가 어긋나지 않는다)",
     flat(SEED).indexOf(flat(STEP3)) >= 0, flat(STEP3));

  const first = allowed("select 1");
  let ran1 = true, why1 = "";
  try{ psqlFile("db/seed/test-providers.sql"); }
  catch(e){ ran1 = false; why1 = String(e.stderr || e.stdout || e.message)
    .trim().split("\n").filter(x => /ERROR/.test(x)).join(" | "); }
  ok("파일이 끝까지 돈다", ran1 && first.yes, why1);

  ok("검사용 업체 셋이 들어간다",
     psql("select count(*)::text from provider where id in " +
          "('t-range','t-fit','t-tour')") === "3");
  ok("셋 다 **검사용으로** 찍힌다 (is_test)",
     psql("select count(*)::text from provider where id in " +
          "('t-range','t-fit','t-tour') and is_test") === "3");
  ok("이름이 스스로 검사용이라고 말한다 (0030 을 안 올린 DB 에 붙여 넣어도)",
     psql("select count(*)::text from provider where id in " +
          "('t-range','t-fit','t-tour') and name like '[검사용]%'") === "3");
  /* ⚠️⚠️ 확인 배지를 켜 두면 **지어낸 신뢰**입니다 (절대 규칙 1) */
  ok("확인 배지가 **비어 있다** (서류를 본 적이 없습니다)",
     psql("select count(*)::text from provider where id in " +
          "('t-range','t-fit','t-tour') and verified <> '{}'::jsonb") === "0");

  /* ⚠️ 하위 키가 진짜인지는 빌드 가드가 봅니다 — 여기서는 **비어 있지
     않은지**만 봅니다 (비면 아무 분류에도 안 뜹니다). */
  ok("subs 가 비어 있지 않다 (비면 아무 분류에도 안 뜹니다)",
     psql("select count(*)::text from provider where id in " +
          "('t-range','t-fit','t-tour') and coalesce(array_length(subs,1),0) = 0") === "0");

  console.log("\n── ② 를 안 하면 ③ 이 **안 켜집니다** (0018 의 자물쇠)");
  ok("계정을 안 이었으니 배정 가능이 **하나도 안 켜졌다**",
     psql("select count(*)::text from provider where id in " +
          "('t-range','t-fit','t-tour') and assignable") === "0");
  /* ⚠️⚠️ **update 는 막혔다고 말해 주지 않습니다** — 0줄이 바뀌고
     성공으로 돌아옵니다. 그래서 파일이 "바뀐 줄 수를 보십시오" 라고
     적어 두었고, 여기서도 **값**으로 잽니다. */

  console.log("\n── ② 를 하고 다시 ③ 을 돌리면");
  const U = psql("insert into auth.users (email) values ('seed-pro@x.test') returning id");
  psql("insert into account (id, role, name, provider_id) values ('" + U +
       "','provider','검사용 업체 사람','t-range') on conflict (id) do update set " +
       "role = excluded.role, name = excluded.name, provider_id = excluded.provider_id");
  const on = allowed(flat(STEP3));
  /* ⚠️ 한 곳만 이었으니 **한 곳만** 켜지는 것이 아니라, 안 이어진 곳에서
     트리거가 터져 **통째로 되돌아갑니다** (한 트랜잭션입니다). 그것이
     맞습니다 — 반쯤 켜진 상태로 끝나면 무엇이 켜졌는지 모릅니다. */
  ok("안 이어진 업체가 섞여 있으면 **통째로** 거절한다", !on.yes, on.why || on.out);
  ok("  그 거절이 **계정 연결** 때문이라고 말한다",
     !on.yes && String(on.why).indexOf("계정이 이어져") >= 0, on.why);
  ok("  그래서 한 곳도 안 켜졌다 (반쯤 켜지지 않는다)",
     psql("select count(*)::text from provider where id in " +
          "('t-range','t-fit','t-tour') and assignable") === "0");

  /* ⚠️ 파일이 "이은 곳만 켜십니다" 로 적어 둔 줄 — 그것도 꺼내 돌립니다 */
  const STEP3B = "update provider set assignable = true where id = 't-range' and is_test = true;";
  ok("'이은 곳만 켜기' 줄도 파일에 적힌 그대로다",
     flat(SEED).indexOf(flat(STEP3B)) >= 0, flat(STEP3B));
  const one = allowed(flat(STEP3B));
  ok("이어 둔 곳 하나만 켜면 켜진다", one.yes, one.why);
  /* ⚠️⚠️ **앞 묶음이 넣어 둔 검사용 업체가 또 있습니다** (quote.js 의
     q-a · q-b). "검사용 가운데 켜진 곳" 으로 세면 그 묶음이 자랄
     때마다 엉뚱하게 떨어집니다 — **이 파일이 넣은 셋만** 셉니다. */
  ok("  켜진 곳이 **하나**다",
     psql("select count(*)::text from provider where assignable " +
          "and id in ('t-range','t-fit','t-tour')") === "1");

  console.log("\n── 손이 미끄러져도 참 업체는 안 켜집니다");
  psql("insert into provider (id, name, listed) values ('seed-real','참 업체 B', true) " +
       "on conflict (id) do nothing");
  psql("update provider set assignable = false where id = 'seed-real'");
  const slip = allowed("update provider set assignable = true " +
                       "where id in ('t-range','seed-real') and is_test = true");
  ok("`and is_test = true` 가 참 업체를 걸러 낸다", slip.yes, slip.why);
  ok("  참 업체는 그대로 꺼져 있다",
     psql("select assignable::text from provider where id='seed-real'") === "false");

  console.log("\n── 두 번 붙여 넣어도 안전한가");
  let ran2 = true, why2 = "";
  try{ psqlFile("db/seed/test-providers.sql"); }
  catch(e){ ran2 = false; why2 = String(e.stderr || e.stdout || e.message)
    .trim().split("\n").filter(x => /ERROR/.test(x)).join(" | "); }
  ok("두 번째도 끝까지 돈다", ran2, why2);
  ok("  업체가 안 늘어난다",
     psql("select count(*)::text from provider " +
          "where id in ('t-range','t-fit','t-tour')") === "3");
  /* ⚠️⚠️ **켜 둔 것을 되돌리지 않습니다.** 파일의 on conflict 가
     `assignable` 을 일부러 안 건드립니다 — 되돌리면 두 번 붙여 넣으신
     분이 ③ 을 다시 해야 하고, 왜 꺼졌는지 모릅니다. */
  ok("  켜 두었던 배정 가능이 **안 꺼진다**",
     psql("select assignable::text from provider where id='t-range'") === "true");

  console.log("\n── 손님 쪽으로 새지 않는가 (파일이 약속한 것)");
  ok("비로그인에게는 공개 보기에 **한 곳도** 안 나온다",
     psql("select become(null); set role anon; " +
          "select count(*)::text from v_provider_card where is_test") === "0");
  ok("  검사용 셋 가운데 어느 id 도 공개 보기에 없다",
     psql("select become(null); set role anon; " +
          "select count(*)::text from v_provider_card " +
          "where id in ('t-range','t-fit','t-tour')") === "0");
};
