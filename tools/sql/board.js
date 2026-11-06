/* ════════════════════════════════════════════════════════════════════
   자유게시판 — 닉네임 · 회원 조회 · 글 사진을 눌러 봅니다 (0059)

   ⚠️⚠️ **여기서 재는 것 다섯** —
     ① 닉네임 문이 **자물쇠마다 다른 말로** 거절하는가 (짧음 · 긺 ·
        줄바꿈 · 사칭 · 남이 쓰는 이름) · 기록에 **글자를 안 담는가**
     ② 공개 보기의 글쓴이 이름이 **닉네임 → 가린 성함**으로 갈리는가
        (가리는 규칙은 보기 한 곳입니다 — 화면이 또 적으면 어긋납니다)
     ③ 운영자가 지우는 문 — 까닭 없이는 안 받고 **0줄이면 거절**하는가
     ④ 회원 조회 — 제 글은 안 세고 · 두 번 열어도 한 줄이고 ·
        비로그인은 조용히 0 이고 · **그 표를 아무도 못 읽는가**
     ⑤ 글 사진 — 경로를 **문이 짓고** · 남의 글에 못 붙이고 ·
        다섯 장이 넘으면 거절하고 · 공개 보기가 anon 에게 열리는가

   ⚠️⚠️⚠️ **읽기는 누구나 · 쓰기는 로그인한 분만** 입니다. 두 가지는
   다른 자물쇠이므로 **갈라서** 잽니다 — anon 이 보기를 읽는지와,
   anon 이 문을 못 부르는지를 따로 봅니다.

   ⚠️ **갯수를 박지 않습니다** — 이 DB 에는 앞 검사(`sql/community.js`)가
   만든 글이 이미 있습니다. **전을 재고 늘어난 값**만 봅니다.
   ════════════════════════════════════════════════════════════════════ */
module.exports = function(T){
  const { ok, psql, denied, allowed } = T;

  console.log("\n── 0059 자유게시판 — 씨앗");
  const A = psql("insert into auth.users (email) values ('bd-a@x.test') returning id");
  const B = psql("insert into auth.users (email) values ('bd-b@x.test') returning id");
  const C = psql("insert into auth.users (email) values ('bd-c@x.test') returning id");
  const M = psql("insert into auth.users (email) values ('bd-m@x.test') returning id");
  /* ⚠️ 0005 의 트리거가 `account` 줄을 먼저 만들므로 `do update` 입니다
     (`do nothing` 으로 넣은 관리자가 customer 로 남은 그 자리). */
  psql("insert into account (id, role, name) values " +
       "('" + A + "','customer','김판수')," +
       "('" + B + "','customer','이영희')," +
       "('" + C + "','customer','박')," +
       "('" + M + "','admin','운영')" +
       " on conflict (id) do update set role = excluded.role, name = excluded.name");

  const as   = u => "select become('" + u + "'); set role authenticated; ";
  const anon = "select become(null); set role anon; ";
  const back = "reset role; select become(null);";
  const nick = u => psql("select coalesce(nick,'(없음)') from account where id = '" + u + "'");

  /* ── ① 닉네임 문 ───────────────────────────────────────────────── */
  console.log("\n── ① 닉네임 — 자물쇠마다 다른 말로 거절합니다");
  const n0 = denied(anon + "select set_my_nick(jsonb_build_object('nick','아무개'));" + back);
  ok("비로그인은 거절당한다", n0.no, "막지 않았습니다");

  const n1 = denied(as(A) + "select set_my_nick(jsonb_build_object('nick','가'));" + back);
  ok("한 글자는 거절한다", n1.no, "막지 않았습니다");
  /* ⚠️ **글자 수를 손으로 세세요** — 처음에 열여섯 글자를 "열일곱" 이라고
     적어 두어 **멀쩡한 문을 실패로** 잡았습니다 (경계값 바로 위를 재려면
     그 수가 실제로 경계 위여야 합니다). 아래는 17 · 바로 밑은 16 입니다. */
  const n2 = denied(as(A) +
    "select set_my_nick(jsonb_build_object('nick','가나다라마바사아자차카타파하가나다'));" + back);
  ok("열일곱 글자는 거절한다 (경계값 바로 위)", n2.no, "막지 않았습니다");
  const n3 = denied(as(A) + "select set_my_nick(jsonb_build_object('nick',E'가\\n나'));" + back);
  ok("줄바꿈이 섞이면 거절한다", n3.no, "막지 않았습니다");
  /* ⚠️⚠️ **사칭이 가장 위험합니다** — "운영자" 로 글을 쓰면 우리가 한 말이
     됩니다 (절대 규칙 3 의 거울상입니다). */
  const n4 = denied(as(A) + "select set_my_nick(jsonb_build_object('nick','운영자'));" + back);
  ok("⚠️⚠️ **운영자로 보일 이름을 거절한다**", n4.no, "막지 않았습니다");
  const n5 = denied(as(A) + "select set_my_nick(jsonb_build_object('nick','ADMIN'));" + back);
  ok("  대소문자를 가리지 않는다 (ADMIN 도 거절)", n5.no, "막지 않았습니다");

  /* 열여섯 글자는 되어야 합니다 — 경계값 바로 안쪽입니다 */
  const n6 = allowed(as(A) +
    "select set_my_nick(jsonb_build_object('nick','가나다라마바사아자차카타파하가나'));" + back);
  ok("열여섯 글자는 받는다 (경계값 바로 안쪽)", n6.yes, n6.why);

  const n7 = allowed(as(A) + "select set_my_nick(jsonb_build_object('nick','버디사냥꾼'));" + back);
  ok("정상 닉네임은 저장된다", n7.yes && nick(A) === "버디사냥꾼", nick(A));

  /* ⚠️⚠️ **자물쇠가 둘입니다** — unique 인덱스와 문의 `exists` 검사.
     문이 먼저 막아야 손님이 알아볼 수 있는 말을 받습니다. */
  const n8 = denied(as(B) + "select set_my_nick(jsonb_build_object('nick','버디사냥꾼'));" + back);
  ok("⚠️ 남이 쓰는 이름은 거절한다", n8.no, "막지 않았습니다");
  ok("  ⚠️⚠️ 그 말이 **인덱스 이름이 아니다** (손님이 읽을 말입니다)",
     n8.no && /이미 쓰고 있는/.test(n8.why) && !/account_nick_uniq/.test(n8.why), n8.why);
  const n9 = denied(as(B) + "select set_my_nick(jsonb_build_object('nick','버디사냥꾼 '));" + back);
  ok("  앞뒤 빈칸만 다른 이름도 거절한다", n9.no, "막지 않았습니다");

  /* ⚠️ 거절하는 말이 **자물쇠마다 다른가** — 같은 말이면 어느 쪽이
     막았는지 알 수 없습니다. 같은 `if` 가 막는 것은 세지 않습니다. */
  const says = [n1.why, n2.why, n3.why, n4.why, n8.why]
    .map(x => String(x).replace(/\s+/g, " ").slice(0, 60));
  ok("자물쇠 다섯이 **다른 말로** 거절한다", new Set(says).size === 5, says.join(" / "));

  /* ⚠️⚠️ **기록에 닉네임 글자를 담지 않습니다** — audit_log 는 오래 남고
     보는 사람도 넓습니다 (0057 에서 대표자 성함을 안 담은 그 자리). */
  const lg = psql("select coalesce(string_agg(to_state || '|' || coalesce(data::text,''), ' '), '') " +
                  "from audit_log where obj = 'account' and obj_id = '" + A + "'");
  ok("⚠️⚠️ 기록에 **닉네임 글자가 없다** (정했다는 사실만)",
     lg.indexOf("nick-set") >= 0 && lg.indexOf("버디사냥꾼") < 0, lg.slice(0, 120));

  /* ── ② 공개 보기의 글쓴이 이름 ─────────────────────────────────── */
  console.log("\n── ② 글쓴이 이름 — 닉네임 → 가린 성함");
  const q1 = psql(as(A) + "select ask_cq(jsonb_build_object('cat','cm-open'," +
    "'title','첫 글입니다','body','자유게시판에 적어 봅니다. 잘 부탁드립니다.'));" + back);
  const q2 = psql(as(C) + "select ask_cq(jsonb_build_object('cat','cm-open'," +
    "'title','한 글자 성함','body','성함이 한 글자인 분의 글입니다. 별이 몇 개인지 봅니다.'));" + back);
  const who = (u, q) => psql(as(u) + "select who from v_cq_public where id = '" + q + "';" + back);
  const named = (u, q) => psql(as(u) + "select named::text from v_cq_public where id = '" + q + "';" + back);

  ok("닉네임을 정한 분은 **닉네임으로** 나온다", who(B, q1) === "버디사냥꾼", who(B, q1));
  ok("  `named` 가 참이다 (화면이 가린 성함과 구별합니다)", named(B, q1) === "true", named(B, q1));
  /* ⚠️⚠️ **별 개수를 글자로 박지 않습니다** — 이름 길이에 따라 늘어납니다
     (0052 에서 `김**` 를 박아 네 글자 이름에 멀쩡한 보기를 실패로 잡은
     그 자리). 뜻을 셋으로 갈라 잽니다. */
  const w2 = who(B, q2);
  ok("  안 정한 분은 첫 글자만 남는다", w2.slice(0, 1) === "박", w2);
  ok("  나머지가 전부 별이다", /^.\*+$/.test(w2), w2);
  ok("  ⚠️ 한 글자 성함도 **별이 하나는 붙는다** (이름만 그대로 나가지 않습니다)",
     w2.length >= 2, w2);
  ok("  `named` 가 거짓이다", named(B, q2) === "false", named(B, q2));

  /* 비우면 다시 가린 성함으로 돌아갑니다 — 비우는 것도 값입니다 */
  const n10 = allowed(as(A) + "select set_my_nick(jsonb_build_object('nick',''));" + back);
  const wBack = who(B, q1);
  ok("⚠️ 비우면 **가린 성함으로 돌아간다** (비우는 것도 값입니다)",
     n10.yes && nick(A) === "(없음)" && /^김\*+$/.test(wBack), nick(A) + " · " + wBack);
  psql(as(A) + "select set_my_nick(jsonb_build_object('nick','버디사냥꾼'));" + back);

  /* ⚠️⚠️ **`by_user` 칸이 아예 없어야 합니다** (0047 이 일부러 뺀 칸) */
  const cols = psql("select coalesce(string_agg(column_name, ','), '') " +
                    "from information_schema.columns where table_name = 'v_cq_public'");
  ok("⚠️⚠️ 공개 보기에 **`by_user` 칸이 없다**", cols.indexOf("by_user") < 0, cols);
  ok("  대신 `mine` · `who` · `named` 가 있다",
     ["mine","who","named","view_n","answer_n","photo_n"].every(c => cols.indexOf(c) >= 0), cols);

  /* ⚠️⚠️ `mine` 은 **보는 사람마다** 달라야 합니다. anon 은 NULL 이
     아니라 **거짓**이어야 합니다 (0034 에서 NULL 로 자물쇠가 열린 자리). */
  ok("`mine` 이 글쓴이에게만 참이다",
     psql(as(A) + "select mine::text from v_cq_public where id = '" + q1 + "';" + back) === "true" &&
     psql(as(B) + "select mine::text from v_cq_public where id = '" + q1 + "';" + back) === "false",
     "갈리지 않았습니다");
  ok("⚠️ anon 에게 `mine` 이 **거짓이다** (NULL 이 아닙니다)",
     psql(anon + "select mine::text from v_cq_public where id = '" + q1 + "';" + back) === "false",
     "NULL 이거나 참입니다");

  /* ⚠️⚠️⚠️ **읽기는 누구나입니다** — 가입 안 하신 분도 글과 댓글을 봅니다 */
  console.log("\n── ②-2 읽기는 누구나 · 쓰기는 로그인한 분만");
  const r0 = allowed(anon + "select count(*) from v_cq_public;" + back);
  ok("⚠️⚠️ anon 이 **글 목록을 읽는다**", r0.yes, r0.why);
  const r1 = allowed(anon + "select count(*) from v_ca_public;" + back);
  ok("anon 이 **댓글도 읽는다**", r1.yes, r1.why);
  const r2 = denied(anon + "select ask_cq(jsonb_build_object('cat','cm-open'," +
    "'title','비회원 글','body','비회원이 글을 올려 봅니다. 막혀야 합니다.'));" + back);
  ok("⚠️ anon 은 **글을 못 올린다**", r2.no, "막지 않았습니다");
  const r3 = denied(anon +
    "select answer_cq(jsonb_build_object('q_id','" + q1 + "','body','비회원 댓글입니다'));" + back);
  ok("anon 은 **댓글도 못 단다**", r3.no, "막지 않았습니다");
  /* ⚠️ 표에 바로 쓰는 길도 없어야 합니다 — 문을 지나지 않는 길입니다 */
  const r4 = denied(anon + "insert into cq (cat, title, body) " +
    "values ('cm-open','표에 바로','표에 바로 넣어 봅니다');" + back);
  ok("anon 이 **표에 바로 못 넣는다**", r4.no, "막지 않았습니다");

  /* 댓글 수는 **세는 것**입니다 — 저장하지 않습니다 */
  const an0 = Number(psql(as(B) + "select answer_n from v_cq_public where id = '" + q1 + "';" + back));
  psql(as(B) + "select answer_cq(jsonb_build_object('q_id','" + q1 + "'," +
       "'body','댓글을 달아 봅니다. 숫자가 늘어나는지 봅니다.'));" + back);
  const an1 = Number(psql(as(B) + "select answer_n from v_cq_public where id = '" + q1 + "';" + back));
  ok("댓글 수가 **실제 줄에서 세어진다** (전 " + an0 + " → " + an1 + ")", an1 === an0 + 1,
     an0 + " → " + an1);
  /* ⚠️⚠️ **또 별 개수를 박을 참이었습니다** — `이*` 로 적어 두어 세 글자
     성함(이영희 → `이**`)에 멀쩡한 보기를 실패로 잡았습니다. 뜻을 갈라서
     잽니다: 첫 글자만 남는가 · 나머지가 전부 별인가 · 본이름이 안 나오는가. */
  const cw = psql(anon + "select who from v_ca_public where q_id = '" + q1 + "' " +
                  "order by created_at desc limit 1;" + back);
  ok("  댓글에도 글쓴이 이름이 가려서 온다",
     cw.slice(0, 1) === "이" && /^.\*+$/.test(cw) && cw.indexOf("영희") < 0, cw);
  ok("  ⚠️ `by_asker` 가 **글쓴이의 댓글만** 참이다",
     psql(anon + "select by_asker::text from v_ca_public where q_id = '" + q1 + "' " +
          "order by created_at desc limit 1;" + back) === "false", "갈리지 않았습니다");

  /* ── ③ 운영자가 닉네임을 지우는 문 ─────────────────────────────── */
  console.log("\n── ③ 운영자가 지우는 문 — 까닭 없이는 안 받습니다");
  const c0 = denied(as(B) +
    "select clear_nick(jsonb_build_object('user','" + A + "','why','부적절합니다'));" + back);
  ok("손님은 남의 닉네임을 못 지운다", c0.no, "막지 않았습니다");
  const c1 = denied(as(M) + "select clear_nick(jsonb_build_object('user','" + A + "'));" + back);
  ok("⚠️⚠️ **까닭 없이는 거절한다** (남의 이름을 지우는 일입니다)", c1.no, "막지 않았습니다");
  const c2 = allowed(as(M) +
    "select clear_nick(jsonb_build_object('user','" + A + "','why','운영자로 보이는 이름'));" + back);
  ok("운영자는 까닭과 함께 지운다", c2.yes && nick(A) === "(없음)", nick(A));
  ok("  기록에 **까닭이 남는다**",
     psql("select coalesce(why,'') from audit_log where obj = 'account' " +
          "and obj_id = '" + A + "' and to_state = 'nick-cleared-by-admin' " +
          "order by at desc limit 1") === "운영자로 보이는 이름", "안 남았습니다");
  /* ⚠️⚠️ **0줄이면 거절합니다** — 조용히 끝내면 기록에 "지웠다" 가 남는데
     실제로는 아무 일도 안 일어난 것입니다 (기록이 거짓이 됩니다). */
  const c3 = denied(as(M) +
    "select clear_nick(jsonb_build_object('user','" + A + "','why','또 지워 봅니다'));" + back);
  ok("⚠️⚠️ 지울 닉네임이 **없으면 거절한다** (기록이 거짓이 되지 않게)",
     c3.no, "조용히 0줄로 끝냈습니다");

  /* ── ④ 회원 조회 ───────────────────────────────────────────────── */
  console.log("\n── ④ 회원 조회 — 지어낸 숫자를 쓰지 않으려고 줄을 남깁니다");
  const vn = q => Number(psql(anon + "select view_n from v_cq_public where id = '" + q + "';" + back));
  const v0 = vn(q1);
  ok("⚠️ 제 글을 열면 **안 센다** (0 을 돌려줍니다)",
     psql(as(A) + "select view_cq(jsonb_build_object('question','" + q1 + "'));" + back) === "0" &&
     vn(q1) === v0, "셌습니다");
  ok("남이 열면 **한 줄 늘어난다**",
     psql(as(B) + "select view_cq(jsonb_build_object('question','" + q1 + "'));" + back) === "1" &&
     vn(q1) === v0 + 1, "안 늘었습니다");
  /* ⚠️⚠️ **두 번째는 0 입니다** — 1 을 돌려주면 "셌다" 고 말하는데 실제로는
     아무 일도 안 일어난 것입니다 (절대 규칙 5). */
  ok("⚠️⚠️ 같은 분이 다시 열면 **0 을 돌려주고 안 늘어난다**",
     psql(as(B) + "select view_cq(jsonb_build_object('question','" + q1 + "'));" + back) === "0" &&
     vn(q1) === v0 + 1, "두 번 셌습니다");
  /* ⚠️⚠️⚠️ **제 주석이 코드와 달랐습니다.** 0059 머리말에 "비로그인은
     조용히 0" 이라고 적어 두었는데, `view_cq` 의 EXECUTE 는
     `authenticated` 에게만 있어서 anon 은 **문을 아예 못 부릅니다**
     (`permission denied for function`). 그것이 맞는 동작입니다 — 쓰는
     문을 anon 에게 열 까닭이 없고, 화면도 로그인했을 때만 부릅니다.
     ⚠️ 함수 안의 `v_me is null` 가지는 **죽은 코드가 아닙니다** — 토큰에
     role 은 있고 주체(sub)가 없는 경우가 그 자리입니다. 그래서 자물쇠
     **둘을 갈라서** 잽니다. */
  const vd0 = denied(anon + "select view_cq(jsonb_build_object('question','" + q1 + "'));" + back);
  ok("⚠️⚠️ anon 은 세는 문을 **아예 못 부른다** (GRANT 가 첫 자물쇠)",
     vd0.no && /permission denied/.test(vd0.why), vd0.why);
  ok("  ⚠️ 그래도 **글은 읽힌다** (읽기와 쓰기는 다른 자물쇠입니다)",
     psql(anon + "select count(*)::text from v_cq_public where id = '" + q1 + "';" + back) === "1",
     "안 읽힙니다");
  /* 주체가 없는 토큰 — role 은 authenticated 인데 auth.uid() 가 null 입니다 */
  ok("주체가 없는 토큰은 **조용히 0** 이다 (에러를 내지 않습니다)",
     psql("select become(null); set role authenticated; " +
          "select view_cq(jsonb_build_object('question','" + q1 + "'));" + back) === "0",
     "거절하거나 셌습니다");
  ok("없는 글도 조용히 0 이다 (있는지 없는지를 알려 주지 않습니다)",
     psql(as(B) + "select view_cq(jsonb_build_object('question'," +
          "'00000000-0000-0000-0000-000000000000'));" + back) === "0", "에러를 냈습니다");
  /* ⚠️⚠️⚠️ **누가 무엇을 봤는지는 아무도 못 읽습니다** — 정책도 GRANT 도
     주지 않았습니다. 세는 것은 보기가 임자 권한으로 합니다. */
  const vd = denied(as(B) + "select count(*) from cqview;" + back);
  ok("⚠️⚠️⚠️ 회원도 **조회 기록 표를 못 읽는다**", vd.no, "읽혔습니다");
  const vd2 = denied(as(M) + "select count(*) from cqview;" + back);
  ok("  ⚠️ **운영자도 못 읽는다** (볼 까닭이 없습니다)", vd2.no, "읽혔습니다");
  ok("  그래도 보기는 센다 (" + vn(q1) + "건)", vn(q1) === v0 + 1, "못 셉니다");

  /* ── ⑤ 글 사진 ─────────────────────────────────────────────────── */
  console.log("\n── ⑤ 글 사진 — 경로를 문이 짓습니다");
  const p1 = psql(as(A) + "select claim_cq_photo(jsonb_build_object('question','" + q1 +
    "','mime','image/jpeg','bytes','120000'))->>'path';" + back);
  ok("⚠️⚠️ 경로를 **문이 짓는다** (`cq/<글>/photo/…`)",
     p1.indexOf("cq/" + q1 + "/photo/") === 0 && /\.jpg$/.test(p1), p1);
  const pd = denied(as(B) + "select claim_cq_photo(jsonb_build_object('question','" + q1 +
    "','mime','image/jpeg','bytes','120000'));" + back);
  ok("⚠️ **남의 글에는 못 붙인다**", pd.no, "막지 않았습니다");
  const pd2 = denied(as(M) + "select claim_cq_photo(jsonb_build_object('question','" + q1 +
    "','mime','image/jpeg','bytes','120000'));" + back);
  ok("  ⚠️ **운영자도 못 붙인다** (글쓴이가 안 올린 것이 달립니다)",
     pd2.no, "막지 않았습니다");
  const pd3 = denied(as(A) + "select claim_cq_photo(jsonb_build_object('question','" + q1 +
    "','mime','application/pdf','bytes','120000'));" + back);
  ok("사진이 아닌 것은 거절한다", pd3.no, "막지 않았습니다");
  const pd4 = denied(as(A) + "select claim_cq_photo(jsonb_build_object('question','" + q1 +
    "','mime','image/jpeg','bytes','9000000'));" + back);
  ok("8MB 가 넘으면 거절한다", pd4.no, "막지 않았습니다");
  /* 다섯 장까지 — 넘으면 거절합니다 */
  for(let i = 0; i < 4; i++)
    psql(as(A) + "select claim_cq_photo(jsonb_build_object('question','" + q1 +
         "','mime','image/png','bytes','90000'));" + back);
  const pd5 = denied(as(A) + "select claim_cq_photo(jsonb_build_object('question','" + q1 +
    "','mime','image/png','bytes','90000'));" + back);
  ok("여섯 번째는 거절한다 (다섯 장까지)", pd5.no, "막지 않았습니다");
  ok("  ⚠️ 보기의 사진 수가 다섯이다",
     psql(anon + "select photo_n::text from v_cq_public where id = '" + q1 + "';" + back) === "5",
     "다섯이 아닙니다");
  /* ⚠️ 공개 보기는 anon 에게 열려 있어야 합니다 (글이 공개이므로) */
  const pv = allowed(anon + "select count(*) from v_cq_photo_public where q_id = '" + q1 + "';" + back);
  ok("anon 이 **사진 목록을 읽는다**", pv.yes, pv.why);
  /* ⚠️⚠️ 표에는 못 들어갑니다 — 경로 꼴을 check 가 다시 봅니다 */
  const pd6 = denied(as(A) + "insert into cqphoto (q_id, by_user, path, mime, bytes) values " +
    "('" + q1 + "','" + A + "','pv/남의업체/doc/증빙.pdf','image/jpeg',1000);" + back);
  ok("⚠️⚠️ 표에 **다른 꼴의 경로를 못 넣는다** (문을 지나지 않는 길)",
     pd6.no, "들어갔습니다");
  const dd = denied(as(B) + "select drop_cq_photo(jsonb_build_object('id'," +
    "(select id::text from cqphoto where q_id = '" + q1 + "' limit 1)));" + back);
  ok("남의 사진은 못 뺀다", dd.no, "막지 않았습니다");
  const dd2 = allowed(as(A) + "select drop_cq_photo(jsonb_build_object('id'," +
    "(select id::text from cqphoto where q_id = '" + q1 + "' limit 1)));" + back);
  ok("올린 분은 뺀다", dd2.yes, dd2.why);
  ok("  뺀 뒤 사진 수가 넷이다",
     psql(anon + "select photo_n::text from v_cq_public where id = '" + q1 + "';" + back) === "4",
     "안 줄었습니다");

  /* ⚠️⚠️ 내려간 글의 사진은 **공개 보기에서 빠져야** 합니다 — 안 빠지면
     가린 뜻이 사라집니다 (가려진 질문의 답변이 둥둥 뜨던 그 자리). */
  /* ⚠️⚠️ **내려간 글의 사진도 같이 빠져야** 합니다 — 안 빠지면 내린 뜻이
     사라지고, 더 나쁘게는 **주소만 알면 열리는 공개 버킷의 사진**이
     목록에 남습니다. 그래서 내리기 **전에** 한 장 붙여 두고 셉니다. */
  psql(as(C) + "select claim_cq_photo(jsonb_build_object('question','" + q2 +
       "','mime','image/webp','bytes','50000'));" + back);
  const ph0 = psql(anon +
    "select count(*)::text from v_cq_photo_public where q_id = '" + q2 + "';" + back);
  ok("내리기 전에는 그 글의 사진이 공개 목록에 있다", ph0 === "1", ph0);

  /* ⚠️ 내리는 문은 `move_cq` 입니다 — `edit_cq` 는 제목 · 내용만 고칩니다
     (처음에 `edit_cq` 에 `state` 를 실어 보냈고, 그 문은 그 열쇠를 **그냥
     무시**합니다). 그리고 q2 는 C 가 쓴 글이라 **C 로** 내립니다. */
  psql(as(C) + "select move_cq(jsonb_build_object('id','" + q2 + "','state','dropped'));" + back);
  const gone = psql(anon + "select count(*)::text from v_cq_public where id = '" + q2 + "';" + back);
  ok("내린 글은 공개 목록에서 빠진다", gone === "0", gone);
  ok("⚠️⚠️ 내린 글의 **사진도 같이 빠진다** (보기의 where 절이 자물쇠입니다)",
     psql(anon + "select count(*)::text from v_cq_photo_public where q_id = '" +
          q2 + "';" + back) === "0", "남아 있습니다");
  ok("  ⚠️ 그래도 표에는 **남아 있다** (신고를 확인할 길을 지웁니다)",
     psql("select count(*)::text from cqphoto where q_id = '" + q2 + "'") === "1",
     "지워졌습니다");

};
