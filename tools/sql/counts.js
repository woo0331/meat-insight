/* ════════════════════════════════════════════════════════════════════
   종류 · 지역별 현황 — 세는 보기 넷 (0067)

   ⚠️⚠️⚠️ **여기서 재는 것은 하나입니다: 표의 숫자와 목록의 줄 수가
   같은가.** 0067 의 보기 넷은 앞 번호의 공개 보기 **위에 못 얹습니다** —
   얹으면 사장님이 붙여넣기 파일을 두 번째로 붙여 넣을 때 0056 · 0048 ·
   0061 · 0063 이 제 보기를 지우려다 "cannot drop view ... because other
   objects depend on it" 으로 **거기서 멈춥니다**(0060 의 v_join_count 가
   밟은 자리 · test-upgrade ⑧).
   그래서 **표에서 직접 세고**, 그 대가로 조건이 두 곳에 적힙니다.
   어긋나면 손님이 보는 표의 숫자와 그 칸을 눌러 들어간 목록의 줄 수가
   달라지는데 **에러가 한 줄도 안 납니다.**

   ⚠️⚠️ **총합으로 맞춰 보면 안 됩니다** — 한쪽이 더 세고 한쪽이 덜 세면
   **상쇄되어 엉뚱한 까닭으로 통과**합니다. 칸마다(줄마다) 봅니다.

   ⚠️ **갯수를 박지 않습니다** — 앞 검사들이 만든 매물 · 구인글 · 글이
   이미 있습니다. 맞춰 보는 것은 "어긋난 칸이 0개인가" 입니다.

   ⚠️⚠️ 그리고 0067 이 같은 번에 고친 **`v_job_open` 의 UTC 버그**도
   여기서 봅니다 — 목록이 `current_date`(UTC)를 쓰면 한국 아침 아홉 시간
   동안 표와 목록이 다른 수를 말하고, 그 시각에만 검사가 떨어집니다.
   ════════════════════════════════════════════════════════════════════ */
module.exports = function(T){
  const { ok, psql, denied, allowed } = T;

  console.log("\n── 0067 종류 · 지역별 현황 (세는 보기 넷)");

  const anon = "set role anon; ";
  const back = " reset role;";

  /* ── ① 보기 넷이 실제로 섰는가 ───────────────────────────────
     ⚠️ 없으면 화면이 **영원히 '–'** 를 적습니다(에러 한 줄 없이) —
     "못 읽었다" 와 "보기가 없다" 가 손님 눈에 똑같이 보입니다. */
  const made = psql(
    "select count(*)::text from information_schema.views where table_name in " +
    "('v_listing_count','v_job_count','v_wanted_count','v_cq_count')");
  ok("세는 보기 **넷이 다 선다**", made === "4", made + "개");

  /* ⚠️⚠️ **숫자만 냅니다** — 보기는 RLS 를 지나지 않으므로 담은 칸이 곧
     공개 범위입니다. 제목 · 본문 · 연락처 · 글쓴이가 섞이면 가린 글 ·
     내린 글의 내용이 그리로 샙니다. */
  const leak = psql(
    "select coalesce(string_agg(table_name || '.' || column_name, ' | '), '') " +
    "  from information_schema.columns where table_name in " +
    "('v_listing_count','v_job_count','v_wanted_count','v_cq_count') " +
    "   and column_name in ('title','body','contact','by_user','agree_at'," +
    "'price','budget','pay','hidden_why')");
  ok("⚠️⚠️ 세는 보기에 **글 내용 · 연락처 칸이 한 개도 없다**",
     leak === "", leak);

  /* ── ② 비로그인도 읽는가 ─────────────────────────────────────
     ⚠️ 현황표는 로그인 전에도 보입니다 — GRANT 가 없으면 0줄이 아니라
     **질의가 통째로 거절**되고, 화면은 "못 읽음" 으로 떨어집니다. */
  ["v_listing_count", "v_job_count", "v_wanted_count", "v_cq_count"].forEach(function(v){
    ok("  anon 이 " + v + " 을 읽는다",
       allowed(anon + "select count(*) from " + v + ";" + back), v);
  });

  /* ── ③ 어긋난 칸이 0개인가 — **칸마다** 봅니다 ────────────────
     ⚠️⚠️ full outer join 입니다 — 한쪽에만 있는 칸도 잡아야 합니다
     (한쪽이 안 세면 그 칸이 아예 안 나옵니다). */
  /* ⚠️⚠️⚠️ **`is not distinct from` 으로 full outer join 을 하면 안 됩니다** —
     Postgres 가 "FULL JOIN is only supported with merge-joinable or
     hash-joinable join conditions" 로 **질의를 통째로 거절**합니다.
     그런데 `wanted.sub` 은 **비어 있을 수 있어서** 그냥 `=` 로 이으면
     그 줄이 양쪽에서 다 빠져 **아무도 안 보는 자리**가 됩니다.
     ⚠️ 그래서 **잇기 전에 양쪽을 같은 글자로** 내려놓습니다
     (`coalesce(col, '~none~')`) — 그러면 평범한 `=` 로 이어지고 빈 칸도
     한 줄로 남습니다. */
  const NONE = "'~none~'";
  function cells(label, listSql, cntView, keys){
    const pick = t => keys.map(function(k){
      return "coalesce(" + t + "." + k + ", " + NONE + ") as " + k;
    }).join(", ");
    const on  = keys.map(function(k){ return "b." + k + " = a." + k; }).join(" and ");
    const lab = keys.map(function(k){
      return "coalesce(a." + k + ", b." + k + ")"; }).join(" || ' ' || ");
    const mis = psql(anon +
      "select coalesce(string_agg(t, ' | '), '')::text from (" +
      "  select " + lab + " || ' 목록=' || coalesce(a.n::text, '없음') ||" +
      "         ' 표=' || coalesce(b.n::text, '없음') as t" +
      "    from (select " + pick("l") + ", l.n from (" + listSql + ") l) a" +
      "    full outer join" +
      "         (select " + pick("c") + ", c.n from " + cntView + " c) b" +
      "      on " + on +
      "   where coalesce(a.n, -1) is distinct from coalesce(b.n, -1)" +
      ") x;" + back);
    ok("⚠️⚠️ " + label + " — 표가 **칸마다 목록과 같다** (조건이 두 곳이라 꼭 봅니다)",
       mis === "", mis.slice(0, 300));
    /* ⚠️⚠️⚠️ **0줄을 재고 초록으로 지나가면 안 됩니다** — 질의가 거절되거나
       양쪽이 다 비어 있으면 어긋난 칸도 0개라 "같다" 로 읽힙니다.
       맞춰 본 칸이 몇 개인지를 **따로** 세고, 0이면 실패입니다
       (작업 기억 — "잰 것이 0개면 실패입니다"). */
    const n = psql(anon +
      "select count(*)::text from (" +
      "  select " + keys.map(function(k){ return "a." + k; }).join(", ") +
      "    from (select " + pick("l") + ", l.n from (" + listSql + ") l) a" +
      "   union" +
      "  select " + keys.map(function(k){ return "b." + k; }).join(", ") +
      "    from (select " + pick("c") + ", c.n from " + cntView + " c) b" +
      ") x;" + back);
    ok("  ⚠️ 맞춰 본 칸이 **0개가 아니다** (잴 것이 0개면 실패입니다)",
       /^[0-9]+$/.test(String(n).trim()) && Number(n) > 0, String(n));
  }

  cells("중고 매물",
        "select sub, region, count(*)::int as n from v_listing_open group by sub, region",
        "v_listing_count", ["sub", "region"]);
  cells("구인 · 구직",
        "select kind, region, count(*)::int as n from v_job_open group by kind, region",
        "v_job_count", ["kind", "region"]);
  cells("구합니다",
        "select cat, sub, region, count(*)::int as n from v_wanted_open group by cat, sub, region",
        "v_wanted_count", ["cat", "sub", "region"]);
  cells("게시판",
        "select cat, count(*)::int as n from v_cq_public group by cat",
        "v_cq_count", ["cat"]);

  /* ── ④ 되돌려 보기 — 글 하나를 내리면 **둘 다** 줄어드는가 ─────
     ⚠️⚠️ 조건이 두 곳이므로 "지금 같다" 만으로는 모자랍니다. 한쪽만
     세는 줄을 만들어 **실제로 잡히는지** 봅니다.
     ⚠️ 표에 바로 넣지 않고 **문으로** 올립니다 — 표에 바로 넣으면
     0056 의 자물쇠를 통째로 지나갑니다. */
  const U = psql("insert into auth.users (email) values ('cnt-a@x.test') returning id");
  psql("insert into account (id, role, name) values ('" + U + "','customer','셈하나') " +
       "on conflict (id) do update set role = excluded.role");
  const as = u => "select become('" + u + "'); set role authenticated; ";

  const LID = psql(as(U) +
    "select open_listing(jsonb_build_object('sub','us-iron','region','jeju'," +
    "'title','셈검사 아이언','body','현황표를 세어 보는 매물입니다.'," +
    "'price', 123000, 'cond','good','ship', false," +
    "'contact','010-0000-0001','agree_at', now()::text));" + back);
  ok("  씨앗 매물이 올라간다", /^[0-9a-f-]{36}$/.test(String(LID).trim()), String(LID));

  function one(v, where){
    return psql(anon + "select coalesce(sum(n),0)::text from " + v +
                " where " + where + ";" + back);
  }
  const l1 = psql(anon + "select count(*)::text from v_listing_open " +
                  "where sub = 'us-iron' and region = 'jeju';" + back);
  const c1 = one("v_listing_count", "sub = 'us-iron' and region = 'jeju'");
  ok("⚠️ 올린 뒤 그 칸이 **둘 다 같다**", l1 === c1 && l1 !== "0", l1 + " vs " + c1);

  psql(as(U) + "select close_listing(jsonb_build_object('id','" +
       String(LID).trim() + "'));" + back);
  const l2 = psql(anon + "select count(*)::text from v_listing_open " +
                  "where sub = 'us-iron' and region = 'jeju';" + back);
  const c2 = one("v_listing_count", "sub = 'us-iron' and region = 'jeju'");
  ok("  내리면 **둘 다** 줄어든다", l2 === c2 && l2 === "0", l2 + " vs " + c2);

  /* ── ⑤ 0067 이 같이 고친 `v_job_open` 의 날짜 ──────────────────
     ⚠️⚠️⚠️ 0048 은 `close_at >= current_date`(UTC)였습니다. 한국 시각
     00:00~09:00 에는 UTC 가 아직 **어제**라, 어제 마감된 구인 글이 한국
     아침에 아직 열린 것으로 보였습니다(0046 의 v_join_open 이 밟고
     0060 이 고친 그 자리).
     ⚠️ **글자로 보는 것과 눌러 보는 것을 갈라서** 잽니다 — 글자만 보면
     주석에 적어 두기만 해도 지나가고, 눌러만 보면 지금이 한국 낮일 때
     둘이 같은 답을 내서 **엉뚱한 까닭으로 통과**합니다. */
  const def = psql("select (pg_get_viewdef('v_job_open'::regclass) ilike " +
                   "'%kst_today%')::text");
  ok("⚠️⚠️ `v_job_open` 이 **한국 날짜**를 본다 (current_date 가 아닙니다)",
     def === "true", def);
  const utc = psql("select (pg_get_viewdef('v_job_open'::regclass) ilike " +
                   "'%current_date%')::text");
  ok("  `current_date` 가 **한 글자도 안 남았다**", utc === "false", utc);

  /* 마감이 지난 글은 **목록에도 표에도** 없어야 합니다.
     ⚠️⚠️ 문은 지난 날짜를 **거절합니다**(그것이 맞습니다) — 그래서 문으로
     올린 뒤 **씨앗으로** 날짜만 지나가게 둡니다. 재려는 것은 문이 아니라
     **보기의 날짜 함수**입니다 (자물쇠를 갈라서 재는 그 버릇). */
  const JID = psql(as(U) +
    "select open_jobpost(jsonb_build_object('kind','hire','sub','cr-caddy'," +
    "'region','jeju','title','셈검사 캐디 구인'," +
    "'body','마감 날짜를 보는 글입니다.','close_at','" +
    psql("select (kst_today() + 7)::text") + "'," +
    "'contact','010-0000-0002','agree_at', now()::text));" + back);
  ok("  씨앗 구인글이 올라간다", /^[0-9a-f-]{36}$/.test(String(JID).trim()),
     String(JID));
  const jOpen = psql(anon + "select count(*)::text from v_job_open where id = '" +
                     String(JID).trim() + "';" + back);
  ok("  마감 전에는 **목록에 있다** (너무 넓게 막는 것도 고장입니다)",
     jOpen === "1", jOpen);

  psql("update jobpost set close_at = kst_today() - 1 where id = '" +
       String(JID).trim() + "'");
  const jl = psql(anon + "select count(*)::text from v_job_open where id = '" +
                  String(JID).trim() + "';" + back);
  const jc = one("v_job_count", "kind = 'hire' and region = 'jeju'");
  ok("⚠️ 마감이 지난 글은 **목록에도 표에도 없다**", jl === "0" && jc === "0",
     jl + " vs " + jc);
};
