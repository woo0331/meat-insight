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

  /* ══════════════════════════════════════════════════════════════
     db/seed/test-board.sql — 게시판 글 열둘 (0059)

     ⚠️⚠️⚠️ **업체 씨앗과 다릅니다.** 업체는 `is_test` 칸이 있어 공개
     보기가 걸러 주지만, `cq` 에는 그런 칸이 없습니다 — 넣은 글은
     **손님에게 그대로 보입니다.** 그래서 이 파일은 "눌러 보고 지우는"
     파일이고, 검사가 재는 것도 **지우는 길이 실제로 도는가** 입니다.
     ⚠️ 안 바꾼 UUID 로 돌리면 **멈춰야** 합니다 — 조용히 들어가면
     없는 사람 이름으로 글이 섭니다.
     ══════════════════════════════════════════════════════════════ */
  console.log("\n── db/seed/test-board.sql 을 **그대로** 붙여 넣어 봅니다");
  const BSEED = fs2.readFileSync(
    path2.join(__dirname, "..", "..", "db", "seed", "test-board.sql"), "utf8");
  const PLACE = "00000000-0000-0000-0000-000000000000";

  /* ① 안 바꾸고 돌리면 **멈추는가** (파일이 약속한 것) */
  const asIs = denied(BSEED);
  ok("UUID 를 안 바꾸면 **그 자리에서 거절한다** (조용히 안 들어간다)",
     asIs.no, "들어갔습니다 — 없는 사람 이름으로 글이 섭니다");
  ok("  그 까닭이 **사람이 알아볼 말**이다 (auth.users 를 가리킨다)",
     /users|foreign key|violates/i.test(String(asIs.why || "")), String(asIs.why));

  /* ② 바꿔서 돌리면 들어가는가 */
  const SU = psql("insert into auth.users (email) values ('seed-board@x.test') returning id");
  const r1 = allowed(BSEED.split(PLACE).join(SU));
  ok("UUID 를 바꾸면 파일이 끝까지 돈다", r1.yes, String(r1.why));

  /* ⚠️ 갯수를 박지 않습니다 — 게시판 수를 `catalog.js` 에서 셉니다 */
  const keepW2 = global.window;
  global.window = {};
  delete require.cache[require.resolve("../../js/data/catalog.js")];
  require("../../js/data/catalog.js");
  const nBoard = (global.window.amCatItems
    ? global.window.amCatItems(global.window.amCat("community")) : []).length;
  global.window = keepW2;            /* ⚠️ 빌려 쓰고 **그대로 돌려놓습니다** */

  ok("게시판 " + nBoard + "곳에 한 장씩 선다 (갯수를 박지 않습니다)",
     nBoard > 0 &&
     psql("select count(distinct cat)::text from cq where title like '[검사용]%'")
       === String(nBoard),
     psql("select count(distinct cat)::text from cq where title like '[검사용]%'"));
  ok("  게시판 키가 전부 cm- 로 시작한다 (분류 키가 섞이지 않았다)",
     psql("select count(*)::text from cq where title like '[검사용]%' " +
          "and cat not like 'cm-%'") === "0");
  ok("  댓글도 들어간다", Number(psql(
     "select count(*)::text from ca a join cq q on q.id = a.q_id " +
     "where q.title like '[검사용]%'")) > 0);

  /* ③ ⚠️⚠️ **손님 눈에 실제로 보이는가** — 안 보이면 넣는 뜻이 없습니다
     (그리고 이것이 업체 씨앗과 정반대인 자리라 그 사실을 못 박습니다) */
  ok("⚠️⚠️ 비로그인 손님에게 **그대로 보인다** (업체 씨앗과 반대입니다)",
     psql("set role anon; select count(*)::text from v_cq_public " +
          "where title like '[검사용]%'") === String(nBoard));

  /* ④ 지우는 길 — ⚠️ 글자를 **파일에서 꺼내** 돌립니다 (글과 검사가
     어긋나지 않게 · ③ 에서 적어 둔 그 까닭) */
  const DEL = "delete from cq where title like '[검사용]%';";
  ok("지우는 SQL 이 파일에 적힌 그대로다",
     flat(BSEED).indexOf(flat(DEL)) >= 0, flat(DEL));

  /* ⚠️ 참 손님 글을 **안 건드리는지**까지 봅니다 — 안 보면 "지워진다"
     만 재고 **너무 넓게 지우는 것**을 놓칩니다. */
  psql("insert into cq (by_user, cat, title, body) values ('" + SU +
       "', 'cm-open', '참 손님이 쓴 글입니다', '이 글은 지워지면 안 됩니다.')");
  const r2 = allowed(DEL);
  ok("지우는 SQL 이 돈다", r2.yes, String(r2.why));
  ok("  검사용 글이 **한 장도 안 남는다**",
     psql("select count(*)::text from cq where title like '[검사용]%'") === "0");
  ok("  ⚠️ 참 손님 글은 **그대로 남는다** (너무 넓게 지우지 않는다)",
     psql("select count(*)::text from cq " +
          "where title = '참 손님이 쓴 글입니다'") === "1");
  ok("  댓글도 같이 사라진다 (cascade)",
     psql("select count(*)::text from ca a join cq q on q.id = a.q_id " +
          "where q.title like '[검사용]%'") === "0");

  /* ── 예시 글 다섯 (지시서 C) ───────────────────────────────────
     ⚠️⚠️ **사장님이 붙여 넣으실 파일은 "글" 이라 아무 검사도 안 봅니다 —
     그 파일을 실제로 붙여 넣어 봅니다** (test-providers.sql 첫 판이
     없는 함수를 적어 두어 거기서 멈췄던 그 자리). */
  console.log("\n── db/seed/example-board.sql 을 **그대로** 붙여 넣어 봅니다");
  const ESEED = fs2.readFileSync(
    path2.join(__dirname, "..", "..", "db", "seed", "example-board.sql"), "utf8");

  /* ⚠️ 안 바꾸면 **FK 가 거절**해야 합니다 — 조용히 넘어가면 사장님은
     들어간 줄 알고 영업을 시작하십니다. */
  const raw = allowed(ESEED);
  ok("⚠️ uuid 를 **안 바꾸면 멈춘다** (조용히 넘어가지 않습니다)",
     !raw.yes, String(raw.why).slice(0, 110));

  /* 이제 사장님이 하시듯 찾아 바꾸기로 넣습니다 */
  const EX = ESEED.split("00000000-0000-0000-0000-000000000000").join(SU);
  const r3 = allowed(EX);
  ok("찾아 바꾸기로 넣으면 **그대로 돈다**", r3.yes, String(r3.why).slice(0, 140));
  ok("  예시 글이 **다섯 장** 섰다",
     psql("select count(*)::text from cq where title like '[예시]%'") === "5");
  /* ⚠️⚠️ **두 번 돌려도 두 벌이 안 생겨야** 합니다 (지시서: idempotent) */
  allowed(EX);
  ok("⚠️⚠️ **두 번 돌려도 다섯 장 그대로다** (두 벌이 안 생깁니다)",
     psql("select count(*)::text from cq where title like '[예시]%'") === "5");
  /* ⚠️ 제목에 `[예시]` 가 **전부** 박혀 있는가 — 손님이 보셔도 스스로
     말하게 합니다 (지시서: 표기 유지) */
  ok("  제목마다 **[예시]** 가 박혀 있다",
     psql("select count(*)::text from cq where title like '[예시]%' " +
          "and title not like '[예시] %'") === "0");
  /* ⚠️ 조회 수 · 댓글 수를 **손으로 안 넣었는지** — 지어낸 숫자 금지 */
  ok("⚠️⚠️ 조회 수 · 댓글 수를 **손으로 안 넣었다** (세어서 냅니다)",
     psql("select count(*)::text from cqview v join cq q on q.id = v.q_id " +
          "where q.title like '[예시]%'") === "0" &&
     psql("select count(*)::text from ca a join cq q on q.id = a.q_id " +
          "where q.title like '[예시]%'") === "0");
  /* ⚠️ 손님 눈에 보이는가 — 0059 가 읽기를 anon 에게 열었습니다 */
  ok("  비로그인 손님에게 **보인다** (그래서 지우는 것이 중요합니다)",
     Number(psql("select become(null); set role anon; " +
       "select count(*) from v_cq_public where title like '[예시]%'")) === 5);

  /* 지우는 SQL — 파일에 적힌 **그 글자 그대로** 돌립니다 */
  const EDEL = "delete from cq where title like '[예시]%';";
  ok("지우는 SQL 이 파일에 적힌 그대로다",
     flat(ESEED).indexOf(flat(EDEL)) >= 0, flat(EDEL));
  psql("insert into cq (by_user, cat, title, body) values ('" + SU +
       "', 'cm-open', '예시가 아닌 참 글입니다', '이 글은 지워지면 안 됩니다.')");
  const r4 = allowed(EDEL);
  ok("지우는 SQL 이 돈다", r4.yes, String(r4.why));
  ok("  예시 글이 **한 장도 안 남는다**",
     psql("select count(*)::text from cq where title like '[예시]%'") === "0");
  ok("  ⚠️ 참 글은 **그대로 남는다** (너무 넓게 지우지 않는다)",
     psql("select count(*)::text from cq " +
          "where title = '예시가 아닌 참 글입니다'") === "1");


  /* ── db/seed/test-listings.sql — 중고 매물 열다섯 (0056 · 0069) ──
     ⚠️⚠️⚠️ **게시판 씨앗과 같은 자리입니다** — `listing` 에도 `is_test`
     칸이 없어서, 넣은 매물은 **비로그인 손님에게 그대로 보입니다.**
     업체 씨앗(`is_test`)과 정반대이므로 그 사실을 못 박습니다.
     ⚠️⚠️ **사장님이 붙여 넣으실 파일은 "글" 이라 아무 검사도 안 봅니다 —
     그 파일을 실제로 붙여 넣어 봅니다**(test-providers.sql 첫 판이 없는
     함수를 적어 두어 거기서 멈췄던 그 자리). */
  console.log("\n── db/seed/test-listings.sql 을 **그대로** 붙여 넣어 봅니다");
  const LSEED = fs2.readFileSync(
    path2.join(__dirname, "..", "..", "db", "seed", "test-listings.sql"), "utf8");

  /* ① 안 바꾸고 돌리면 **멈추는가** (파일이 약속한 것) */
  const lRaw = denied(LSEED);
  ok("UUID 를 안 바꾸면 **그 자리에서 거절한다** (조용히 안 들어간다)",
     lRaw.no, "들어갔습니다 — 없는 사람 이름으로 매물이 섭니다");
  ok("  그 까닭이 **사람이 알아볼 말**이다 (auth.users 를 가리킨다)",
     /users|foreign key|violates/i.test(String(lRaw.why || "")), String(lRaw.why));

  /* ② 바꿔서 돌리면 들어가는가 */
  const LU = psql("insert into auth.users (email) values ('seed-lst@x.test') returning id");
  const lr1 = allowed(LSEED.split(PLACE).join(LU));
  ok("UUID 를 바꾸면 파일이 끝까지 돈다", lr1.yes, String(lr1.why).slice(0, 160));

  /* ⚠️ **갯수를 박지 않습니다** — 물건 종류를 `catalog.js` 에서 셉니다.
     종류가 느는 날(0069 가 일곱→열셋 · 2026-11-09 가 열다섯) 이 검사가
     스스로 "그 종류가 빠졌다" 고 말합니다. */
  const keepW3 = global.window;
  global.window = {};
  delete require.cache[require.resolve("../../js/data/catalog.js")];
  require("../../js/data/catalog.js");
  const SUBS = (global.window.amCatItems
    ? global.window.amCatItems(global.window.amCat("used")) : [])
    .filter(function(s){ return !s.pv; }).map(function(s){ return s.key; });
  global.window = keepW3;            /* ⚠️ 빌려 쓰고 **그대로 돌려놓습니다** */

  ok("물건 종류 " + SUBS.length + "가지에 하나씩 선다 (갯수를 박지 않습니다)",
     SUBS.length > 0 &&
     psql("select count(distinct sub)::text from listing where title like '[검사용]%'")
       === String(SUBS.length),
     psql("select string_agg(distinct sub, ',') from listing where title like '[검사용]%'"));
  ok("  ⚠️ `catalog.js` 에 **없는 종류 키가 섞이지 않았다** (어느 탭에도 안 보입니다)",
     psql("select count(*)::text from listing where title like '[검사용]%' and sub not in ("
          + SUBS.map(function(k){ return "'" + k + "'"; }).join(",") + ")") === "0");

  /* ⚠️ 눌러 보실 것들이 실제로 들어갔는지 — 덮개 둘과 0원 하나 */
  ok("  예약중 · 판매완료가 한 개씩 있다 (덮개를 보시려고)",
     psql("select count(*)::text from listing where title like '[검사용]%' " +
          "and state = 'reserved'") === "1" &&
     psql("select count(*)::text from listing where title like '[검사용]%' " +
          "and state = 'done'") === "1");
  ok("  ⚠️⚠️ 값 **0 이 한 개 있다** (「무료로 나눔」이 나오는지 보시려고)",
     psql("select count(*)::text from listing where title like '[검사용]%' " +
          "and price = 0") === "1");

  /* ③ ⚠️⚠️ **사진을 한 줄도 안 넣었는지** — 없는 파일을 가리키면
     카드가 깨진 그림으로 찍힙니다 (0장이면 아이콘 타일이 맞습니다) */
  ok("⚠️⚠️ 사진 줄을 **한 줄도 안 넣는다** (없는 파일을 가리키지 않습니다)",
     psql("select count(*)::text from listingphoto p join listing l on l.id = p.listing_id " +
          "where l.title like '[검사용]%'") === "0");

  /* ④ ⚠️ **참 전화번호를 안 넣었는지** — 지어낸 번호는 엉뚱한 분께
     전화가 갑니다 (그 칸은 공개 보기에 아예 없습니다) */
  ok("⚠️ 연락처에 **숫자로 된 번호가 없다** (엉뚱한 분께 전화가 갑니다)",
     psql("select count(*)::text from listing where title like '[검사용]%' " +
          "and contact ~ '[0-9]{3}'") === "0");

  /* ⑤ ⚠️⚠️ **손님 눈에 실제로 보이는가** — 안 보이면 넣는 뜻이 없고,
     보이기 때문에 **지우는 것이 중요합니다**(업체 씨앗과 정반대) */
  ok("⚠️⚠️ 비로그인 손님에게 **그대로 보인다** (업체 씨앗과 반대입니다)",
     psql("select become(null); set role anon; " +
          "select count(*) from v_listing_open where title like '[검사용]%'")
       === String(SUBS.length - 1),
     "판매완료 한 개는 목록에서 빠지므로 " + (SUBS.length - 1) + " 입니다");

  /* ⑥ 지우는 길 — ⚠️ 글자를 **파일에서 꺼내** 돌립니다 */
  const LDEL = "delete from listing where title like '[검사용]%';";
  ok("지우는 SQL 이 파일에 적힌 그대로다",
     flat(LSEED).indexOf(flat(LDEL)) >= 0, flat(LDEL));

  /* ⚠️ 참 손님 매물을 **안 건드리는지**까지 — 안 보면 "지워진다" 만
     재고 **너무 넓게 지우는 것**을 놓칩니다. */
  psql("select become(null); insert into listing " +
       "(by_user, sub, region, ship, title, body, price, cond, contact, agree_at) " +
       "values ('" + LU + "', 'us-iron', 'seoul', false, " +
       "'참 손님이 올린 매물입니다', '이 매물은 지워지면 안 됩니다.', " +
       "100000, 'good', '연락처', now())");
  const lr2 = allowed(LDEL);
  ok("지우는 SQL 이 돈다", lr2.yes, String(lr2.why));
  ok("  검사용 매물이 **한 개도 안 남는다**",
     psql("select count(*)::text from listing where title like '[검사용]%'") === "0");
  ok("  ⚠️ 참 손님 매물은 **그대로 남는다** (너무 넓게 지우지 않습니다)",
     psql("select count(*)::text from listing " +
          "where title = '참 손님이 올린 매물입니다'") === "1");

};
