/* ════════════════════════════════════════════════════════════════════
   조건 저장 → 맞는 글이 올라오면 알림 — 눌러 봅니다 (0058)

   ⚠️⚠️ **여기서 재는 것 다섯** —
     ① 조건을 저장하는 문이 **못 걸릴 조건을 거절하는가**
        (조인에 하위분류 · 조인 아닌데 부킹 · 중고 아닌데 택배)
     ② **같은 조건을 두 번** 저장해도 줄이 하나인가
        (두 벌이면 글 하나에 알림이 두 장 꽂힙니다)
     ③ 글이 올라올 때 **맞는 조건에만** 알림이 가는가
     ④ **제 글은 제게 안 알리는가** (0050 의 notify_one 이 봅니다)
     ⑤ 남의 조건을 **못 읽는가** · 표에 바로 못 쓰는가

   ⚠️⚠️⚠️ **마이그레이션을 걸치는 자리입니다** — 표와 문은 0058,
   받는 쪽(`notice`)은 0050, 글은 0046 · 0048 · 0056 입니다. 그래서
   **문으로 올리고 받는 사람 눈으로** 셉니다 (0050 의 조인 신청 알림
   트리거를 줄째 빼도 `sql/notice.js` 가 초록이던 그 자리입니다).

   ⚠️ **갯수를 박지 않습니다** — 이 DB 에는 앞 검사들이 만든 알림이
   이미 있습니다. **전을 재고 늘어난 값**만 봅니다.
   ════════════════════════════════════════════════════════════════════ */
module.exports = function(T){
  const { ok, psql, denied, allowed } = T;

  console.log("\n── 0058 조건 저장 — 씨앗");
  const A = psql("insert into auth.users (email) values ('wch-a@x.test') returning id");
  const B = psql("insert into auth.users (email) values ('wch-b@x.test') returning id");
  psql("insert into account (id, role, name) values " +
       "('" + A + "','customer','조건저장')," +
       "('" + B + "','customer','글올림') " +
       "on conflict (id) do update set role = excluded.role, name = excluded.name");

  const as   = u => "select become('" + u + "'); set role authenticated; ";
  const anon = "select become(null); set role anon; ";
  const back = "reset role; select become(null);";
  /* ⚠️ 받는 사람 눈으로 셉니다 — 운영자로 훑으면 0줄이고(0050 은 운영자
     정책을 일부러 안 두었습니다) 그 0 을 보고 통과하는 검사가 됩니다. */
  const mine = (u, obj, id) => psql(as(u) +
    "select count(*)::int from notice where kind = 'watch' " +
    "and obj = '" + obj + "' and obj_id = '" + id + "';" + back);

  /* ── ① 못 걸릴 조건을 거절하는가 ───────────────────────────────── */
  console.log("\n── ① 못 걸릴 조건은 거절합니다");
  const d0 = denied(anon + "select save_watch(jsonb_build_object('kind','join'));" + back);
  ok("비로그인은 거절당한다", d0.no, "막지 않았습니다");
  const d1 = denied(as(A) + "select save_watch(jsonb_build_object('kind','없는갈래'));" + back);
  ok("없는 갈래는 거절한다", d1.no, "막지 않았습니다");
  /* ⚠️⚠️ **조인에는 하위분류 칸이 없습니다** — 받아 두면 영원히 안 걸리는
     조건이 됩니다 (눌러도 아무 일이 안 나는 칸과 같은 자리). */
  const d2 = denied(as(A) +
    "select save_watch(jsonb_build_object('kind','join','sub','ls-solo'));" + back);
  ok("⚠️⚠️ 조인에 하위분류를 주면 **거절한다** (글에 그 칸이 없습니다)",
     d2.no, "막지 않았습니다");
  ok("  ⚠️ 까닭을 말로 적는다 (다른 자물쇠와 말이 다릅니다)",
     d2.no && /하위분류/.test(d2.why), d2.why);
  const d3 = denied(as(A) +
    "select save_watch(jsonb_build_object('kind','join','ship',true));" + back);
  ok("조인에 택배 조건을 주면 거절한다", d3.no, "막지 않았습니다");
  const d4 = denied(as(A) +
    "select save_watch(jsonb_build_object('kind','listing','booked',true));" + back);
  ok("중고에 부킹 조건을 주면 거절한다", d4.no, "막지 않았습니다");
  const d5 = denied(as(A) +
    "select save_watch(jsonb_build_object('kind','listing','maxPrice','열만원'));" + back);
  ok("금액이 숫자가 아니면 거절한다", d5.no, "막지 않았습니다");
  /* ⚠️⚠️ **0 은 되어야 합니다** — 중고의 0 은 "무료로 나눔" 입니다.
     "안 적음" 과 **뜻이 다릅니다**. */
  const s0 = allowed(as(A) +
    "select save_watch(jsonb_build_object('kind','listing','maxPrice','0'));" + back);
  ok("⚠️⚠️ 금액 **0 은 저장된다** (무료로 나눔입니다 — 안 적음이 아닙니다)",
     s0.yes, s0.why);
  ok("  0 이 0 으로 들어갔다 (null 로 바뀌지 않았다)",
     psql("select count(*)::int from watch where by_user = '" + A +
          "' and kind = 'listing' and max_price = 0") === "1",
     psql("select coalesce(max_price::text,'(null)') from watch where by_user = '" +
          A + "' and kind = 'listing' limit 1"));

  /* ── ② 같은 조건을 두 번 ───────────────────────────────────────── */
  console.log("\n── ② 같은 조건을 두 번 저장해도 줄은 하나");
  const w1 = psql(as(A) + "select save_watch(jsonb_build_object(" +
    "'kind','listing','sub','us-iron','region','seoul','maxPrice','500000'));" + back);
  const w2 = psql(as(A) + "select save_watch(jsonb_build_object(" +
    "'kind','listing','sub','us-iron','region','seoul','maxPrice','500000'));" + back);
  ok("⚠️⚠️ 같은 조건이면 **같은 줄을 돌려준다** (거절하지 않습니다)",
     w1 === w2 && w1.length > 10, w1 + " / " + w2);
  ok("  줄이 하나다 (두 벌이면 알림이 두 장 꽂힙니다)",
     psql("select count(*)::int from watch where by_user = '" + A +
          "' and kind = 'listing' and sub = 'us-iron'") === "1");

  /* ── ③ 맞는 조건에만 알림 ──────────────────────────────────────── */
  console.log("\n── ③ 글이 올라오면 **맞는 조건에만** 알립니다");
  /* 안 맞는 조건 둘 — 지역이 다르고, 금액이 모자랍니다 */
  psql(as(A) + "select save_watch(jsonb_build_object(" +
    "'kind','listing','sub','us-iron','region','busan'));" + back);
  psql(as(A) + "select save_watch(jsonb_build_object(" +
    "'kind','listing','sub','us-iron','region','seoul','maxPrice','10000'));" + back);
  /* ⚠️ 문으로 올립니다 — 표에 바로 insert 하면 0056 의 자물쇠를 통째로
     지나가고, 그 초록은 아무 뜻이 없습니다. */
  const lid = psql(as(B) + "select open_listing(jsonb_build_object(" +
    "'sub','us-iron','region','seoul','title','아이언 세트 팝니다'," +
    "'body','상태 좋습니다. 직거래 가능합니다.','price','400000'," +
    "'cond','good','brand','핑','ship',true,'contact','010-1111-2222'," +
    "'agree_at', now()::text));" + back);
  ok("매물이 문으로 올라갔다", lid.length > 10, lid);
  ok("⚠️⚠️ **조건이 맞는 분께 알림이 한 장** 꽂혔다",
     mine(A, "listing", lid) === "1", mine(A, "listing", lid));
  /* ⚠️ 안 맞는 조건으로는 더 안 꽂힙니다 — `notify_one` 이 "안 읽은 같은
     알림" 을 가려 주므로 **줄 수로는 알 수 없습니다.** 그래서 안 맞는
     조건만 가진 **다른 사람**으로 따로 봅니다. */
  const C = psql("insert into auth.users (email) values ('wch-c@x.test') returning id");
  psql("insert into account (id, role, name) values ('" + C + "','customer','딴지역') " +
       "on conflict (id) do update set name = excluded.name");
  psql(as(C) + "select save_watch(jsonb_build_object(" +
    "'kind','listing','region','busan'));" + back);
  const lid2 = psql(as(B) + "select open_listing(jsonb_build_object(" +
    "'sub','us-iron','region','seoul','title','두 번째 아이언'," +
    "'body','이것도 상태 좋습니다.','price','300000'," +
    "'cond','good','brand','핑','ship',false,'contact','010-1111-3333'," +
    "'agree_at', now()::text));" + back);
  ok("⚠️⚠️ 지역이 다른 분께는 **한 장도 안 간다**",
     mine(C, "listing", lid2) === "0", mine(C, "listing", lid2));
  /* ⚠️ 택배 조건 — 두 번째 매물은 택배가 안 됩니다 */
  const D = psql("insert into auth.users (email) values ('wch-d@x.test') returning id");
  psql("insert into account (id, role, name) values ('" + D + "','customer','택배만') " +
       "on conflict (id) do update set name = excluded.name");
  psql(as(D) + "select save_watch(jsonb_build_object(" +
    "'kind','listing','region','seoul','ship',true));" + back);
  const lid3 = psql(as(B) + "select open_listing(jsonb_build_object(" +
    "'sub','us-iron','region','seoul','title','세 번째 아이언'," +
    "'body','직거래만 합니다.','price','200000'," +
    "'cond','good','brand','핑','ship',false,'contact','010-1111-4444'," +
    "'agree_at', now()::text));" + back);
  ok("⚠️ 택배만 받겠다고 하신 분께 **직거래 매물은 안 간다**",
     mine(D, "listing", lid3) === "0", mine(D, "listing", lid3));

  /* ── ④ 제 글은 제게 안 알립니다 ───────────────────────────────── */
  console.log("\n── ④ 제 글은 제게 안 알립니다");
  psql(as(B) + "select save_watch(jsonb_build_object(" +
    "'kind','listing','region','seoul'));" + back);
  const lid4 = psql(as(B) + "select open_listing(jsonb_build_object(" +
    "'sub','us-iron','region','seoul','title','제가 올린 것'," +
    "'body','제 조건에도 맞습니다.','price','100000'," +
    "'cond','good','brand','핑','ship',true,'contact','010-1111-5555'," +
    "'agree_at', now()::text));" + back);
  ok("⚠️⚠️ 제가 올린 글은 **제게 안 옵니다** (0050 의 notify_one 이 봅니다)",
     mine(B, "listing", lid4) === "0", mine(B, "listing", lid4));
  ok("  그 글은 **다른 분께는** 갑니다 (너무 넓게 막지 않았습니다)",
     mine(A, "listing", lid4) === "1", mine(A, "listing", lid4));

  /* ── ⑤ 자물쇠 ──────────────────────────────────────────────────── */
  console.log("\n── ⑤ 남의 조건은 못 읽고 표에는 못 씁니다");
  ok("⚠️ 남의 조건이 **한 줄도 안 보인다**",
     psql(as(B) + "select count(*)::int from watch where by_user = '" + A + "';" + back) === "0");
  const g1 = denied(as(A) +
    "insert into watch (by_user, kind) values ('" + A + "','join');" + back);
  ok("⚠️⚠️ 표에 **바로 못 넣는다** (들어오는 길은 문뿐입니다)",
     g1.no, "넣어졌습니다 — GRANT 를 줬습니다");
  const g2 = denied(as(B) +
    "select drop_watch(jsonb_build_object('id','" + w1 + "'));" + back);
  ok("남의 조건은 **못 지운다**", g2.no, "지워졌습니다");
  ok("  ⚠️ 0줄로 조용히 끝내지 않고 **거절한다** (기록이 거짓이 되지 않게)",
     g2.no && /찾을 수 없습니다/.test(g2.why), g2.why);
  const s9 = allowed(as(A) +
    "select drop_watch(jsonb_build_object('id','" + w1 + "'));" + back);
  ok("제 조건은 지워진다", s9.yes && s9.out === "1", s9.why || s9.out);

  /* ⚠️ 갈래마다 열 개까지 — 수백 개면 글 하나에 수백 줄을 훑습니다 */
  console.log("\n── 갈래마다 열 개까지");
  psql("insert into watch (by_user, kind, region) select '" + A + "','join', g::text " +
       "from generate_series(1, 10) g on conflict do nothing");
  const d9 = denied(as(A) +
    "select save_watch(jsonb_build_object('kind','join','region','seoul'));" + back);
  ok("열 개를 넘기면 거절한다", d9.no, "막지 않았습니다");
  ok("  ⚠️ 몇 개인지 말해 준다 (무엇을 하라는 말이 같이 갑니다)",
     d9.no && /열 개/.test(d9.why), d9.why);
  /* ⚠️ 다른 갈래는 그대로 됩니다 — 너무 넓게 막는 것도 고장입니다 */
  const s8 = allowed(as(A) +
    "select save_watch(jsonb_build_object('kind','job','region','seoul'));" + back);
  ok("  다른 갈래는 그대로 된다 (너무 넓게 막지 않았습니다)", s8.yes, s8.why);
  psql("delete from watch where by_user = '" + A + "' and kind = 'join'");

  /* ── 안쪽 함수 ─────────────────────────────────────────────────── */
  /* ⚠️⚠️⚠️ **함수는 표와 반대입니다** — 만드는 순간 public 에게 EXECUTE
     가 붙습니다 (0050 의 notify_one 이 그래서 누구나 알림을 꽂을 수
     있었습니다). 트리거 함수 셋을 직접 못 부르는지 봅니다. */
  console.log("\n── 트리거 함수를 직접 못 부릅니다");
  ["watch_join","watch_listing","watch_job"].forEach(function(f){
    const d = denied(as(A) + "select " + f + "();" + back);
    ok("⚠️⚠️ " + f + " 를 직접 못 부른다", d.no,
       "불러졌습니다 — revoke all … from public 이 빠졌습니다");
  });
};
