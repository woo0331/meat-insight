/* ════════════════════════════════════════════════════════════════════
   자유게시판 — 로그인 없이 쓰고 · 고치고 · 내립니다 (0063 · 지시서 C)

   ⚠️⚠️⚠️ **비회원 글은 주인을 가리는 자물쇠가 비밀번호 하나뿐입니다.**
   그 하나가 새면 남의 글을 고치고 내립니다. 그래서 자물쇠를 **갈라서**
   눌러 봅니다 —
     ① 해시가 **밖으로 안 나가는가** — 공개 보기에 칸이 아예 없고,
        표의 칸 GRANT 에서도 빠졌는가 (둘은 **다른 자물쇠**입니다)
     ② 틀린 비밀번호로는 못 고치고 못 내리는가 · **회원 글에는
        아예 안 먹는가**
     ③ 맞는 비밀번호면 되는가 (너무 넓게 막는 것도 고장입니다)
     ④ 평문이 **어디에도 안 남는가**
     ⑤ 허니팟 · 길이 자물쇠가 **저마다 다른 말로** 거절하는가
     ⑥ 내리면 **지우지 않고** 공개 보기에서만 빠지는가
   ⚠️ 갯수를 박지 않습니다 — **전을 재고 늘어난 값**만 봅니다.
   ════════════════════════════════════════════════════════════════════ */
module.exports = function(T){
  const { ok, psql, denied } = T;

  console.log("\n── 0063 비회원 자유게시판");
  const anon = "select become(null); set role anon; ";
  const U = psql("insert into auth.users (email) values ('gq-u@x.test') returning id");
  psql("insert into account (id, role, name) values ('" + U + "','customer','최회원')" +
       " on conflict (id) do update set role = excluded.role, name = excluded.name");

  const PW = "pw-1234";
  const call = (fn, j) => psql(anon + "select " + fn + "('" + j + "'::jsonb)");

  /* ── ⑤ 자물쇠마다 다른 말 ─────────────────────────────────────── */
  const says = {};
  [["trap",   '{"nick":"손님","cat":"cm-open","title":"제목입니다","body":"내용입니다 여기", "pw":"pw-1234","website":"http://spam"}'],
   ["nocat",  '{"nick":"손님","cat":"","title":"제목입니다","body":"내용입니다 여기","pw":"pw-1234"}'],
   ["short",  '{"nick":"ㄱ","cat":"cm-open","title":"제목입니다","body":"내용입니다 여기","pw":"pw-1234"}'],
   ["fake",   '{"nick":"운영자","cat":"cm-open","title":"제목입니다","body":"내용입니다 여기","pw":"pw-1234"}'],
   ["title",  '{"nick":"손님","cat":"cm-open","title":"ㄱ","body":"내용입니다 여기","pw":"pw-1234"}'],
   ["body",   '{"nick":"손님","cat":"cm-open","title":"제목입니다","body":"짧","pw":"pw-1234"}'],
   ["pw",     '{"nick":"손님","cat":"cm-open","title":"제목입니다","body":"내용입니다 여기","pw":"12"}']
  ].forEach(function(x){ says[x[0]] = denied(anon + "select ask_cq_guest('" + x[1] + "'::jsonb)"); });

  ok("⚠️⚠️ 허니팟이 채워지면 **거절**한다 (조용히 성공시키지 않습니다)",
     !!says.trap, String(says.trap));
  ok("  게시판 · 닉네임 길이 · 사칭 · 제목 · 내용 · 비밀번호가 전부 막힌다",
     !!(says.nocat && says.short && says.fake && says.title && says.body && says.pw), "");
  /* ⚠️ **다른 자물쇠는 다른 말로** 거절해야 어디가 막혔는지 압니다 */
  const uniq = new Set(Object.values(says).map(String));
  ok("  ⚠️ 자물쇠 일곱이 **일곱 가지 말**로 거절한다", uniq.size === 7,
     uniq.size + "가지: " + [...uniq].join(" / ").slice(0, 220));

  /* ── 올리기 ───────────────────────────────────────────────────── */
  const before = Number(psql("select count(*) from cq where by_user is null"));
  const ID = call("ask_cq_guest",
    '{"nick":"길손","cat":"cm-open","title":"비회원 글입니다","body":"로그인 없이 올린 글입니다","pw":"' + PW + '"}');
  ok("⚠️ 로그인 없이 **글이 올라간다**", /^[0-9a-f-]{36}$/.test(String(ID).trim()), String(ID));
  ok("  늘어난 줄이 하나다",
     Number(psql("select count(*) from cq where by_user is null")) === before + 1, "");

  /* ── ④ 평문이 안 남는가 ──────────────────────────────────────── */
  const plain = psql("select count(*) from cq where guest_pw = '" + PW + "'");
  ok("⚠️⚠️⚠️ **평문 비밀번호가 표에 한 줄도 없다** (단방향 해시입니다)",
     Number(plain) === 0, "평문으로 저장된 줄 " + plain);
  const hash = psql("select left(guest_pw, 4) from cq where id = '" + ID + "'");
  ok("  해시가 **bcrypt** 꼴이다 ($2…)", String(hash).trim().indexOf("$2") === 0, String(hash));

  /* ── ① 해시가 밖으로 안 나가는가 — 자물쇠 둘을 갈라서 ─────────── */
  const inView = psql("select count(*) from information_schema.columns " +
    "where table_name = 'v_cq_public' and column_name = 'guest_pw'");
  ok("⚠️⚠️⚠️ ① 공개 보기에 `guest_pw` 칸이 **아예 없다**",
     Number(inView) === 0, "칸 " + inView + "개");
  const g1 = psql("select has_column_privilege('anon','cq','guest_pw','select')::text");
  const g2 = psql("select has_column_privilege('authenticated','cq','guest_pw','select')::text");
  ok("⚠️⚠️ ② 표의 칸 GRANT 에서도 빠졌다 (anon · authenticated 둘 다)",
     g1.trim() === "false" && g2.trim() === "false", g1 + " / " + g2);
  /* ⚠️ 안 준 칸을 `where` 에 쓰면 **0줄이 아니라 질의가 통째로 거절**됩니다 */
  ok("  ⚠️ 그 칸을 조건에 쓰면 **질의가 거절된다**",
     !!denied(anon + "select count(*) from cq where guest_pw is not null"), "");
  const open = psql(anon + "select count(*) from v_cq_public where id = '" + ID + "'");
  ok("  ⚠️ 그래도 글은 **비로그인에게 보인다** (읽기는 누구나)",
     Number(open) === 1, "줄 " + open);
  ok("  보기가 **닉네임을 그대로** 낸다",
     psql(anon + "select who from v_cq_public where id = '" + ID + "'").trim() === "길손", "");
  ok("  보기가 **비회원 글이라고** 말한다 (화면이 비밀번호 칸을 내는 데 씁니다)",
     psql(anon + "select guest::text from v_cq_public where id = '" + ID + "'").trim() === "true", "");

  /* ── ② 틀린 비밀번호 ─────────────────────────────────────────── */
  const bad = denied(anon + "select edit_cq_guest('{\"id\":\"" + ID + "\",\"pw\":\"nope\",\"title\":\"바뀐 제목\"}'::jsonb)");
  ok("⚠️⚠️ 틀린 비밀번호로는 **못 고친다**", !!bad, String(bad));
  ok("  제목이 그대로다",
     psql("select title from cq where id = '" + ID + "'").trim() === "비회원 글입니다", "");
  ok("  틀린 비밀번호로는 **못 내린다**",
     !!denied(anon + "select drop_cq_guest('{\"id\":\"" + ID + "\",\"pw\":\"nope\"}'::jsonb)"), "");

  /* ⚠️⚠️ **회원 글에는 아예 안 먹어야** 합니다 — 비회원 문으로 회원 글을
     건드릴 수 있으면 비밀번호 없는 글을 아무나 고치는 자리가 됩니다. */
  const MQ = psql("select become('" + U + "'); set role authenticated; " +
    "select ask_cq('{\"cat\":\"cm-open\",\"title\":\"회원이 쓴 글\",\"body\":\"회원 글 내용입니다\"}'::jsonb)");
  ok("⚠️⚠️⚠️ **회원 글은 비회원 문으로 못 고친다**",
     !!denied(anon + "select edit_cq_guest('{\"id\":\"" + MQ + "\",\"pw\":\"\",\"title\":\"가로채기\"}'::jsonb)"),
     "");
  ok("  회원 글은 비회원 문으로 **못 내린다**",
     !!denied(anon + "select drop_cq_guest('{\"id\":\"" + MQ + "\",\"pw\":\"\"}'::jsonb)"), "");
  /* ⚠️ **없는 글과 회원 글을 같은 말로** 거절합니다 — 말이 갈리면
     "이 번호는 있는 글" 을 알려 주는 자리가 됩니다. */
  const ghost = denied(anon + "select edit_cq_guest('{\"id\":\"00000000-0000-0000-0000-000000000000\",\"pw\":\"x\"}'::jsonb)");
  const mem   = denied(anon + "select edit_cq_guest('{\"id\":\"" + MQ + "\",\"pw\":\"x\"}'::jsonb)");
  ok("  ⚠️ 없는 글과 회원 글을 **같은 말로** 거절한다 (있는지를 안 알려 줍니다)",
     String(ghost) === String(mem), String(ghost) + " vs " + String(mem));

  /* ── ③ 맞는 비밀번호면 된다 ──────────────────────────────────── */
  call("edit_cq_guest", '{"id":"' + ID + '","pw":"' + PW + '","title":"고친 제목"}');
  ok("⚠️ 맞는 비밀번호면 **고쳐진다** (너무 넓게 막는 것도 고장입니다)",
     psql("select title from cq where id = '" + ID + "'").trim() === "고친 제목", "");
  /* ⚠️ **보낸 칸만** 고칩니다 — 내용은 그대로여야 합니다 */
  ok("  ⚠️ 안 보낸 칸(내용)은 **안 지워진다**",
     psql("select body from cq where id = '" + ID + "'").trim() === "로그인 없이 올린 글입니다", "");
  /* ⚠️ 게시판은 못 바꿉니다 (읽던 분이 다른 글을 보게 됩니다) */
  call("edit_cq_guest", '{"id":"' + ID + '","pw":"' + PW + '","cat":"cm-ask","title":"또 고침"}');
  ok("  ⚠️⚠️ 게시판은 **보내도 안 바뀐다**",
     psql("select cat from cq where id = '" + ID + "'").trim() === "cm-open", "");

  /* ── ⑥ 내리면 지우지 않고 빠진다 ─────────────────────────────── */
  call("drop_cq_guest", '{"id":"' + ID + '","pw":"' + PW + '"}');
  ok("⚠️⚠️ 내려도 **줄은 남는다** (지우면 분쟁 때 낼 것이 없습니다)",
     Number(psql("select count(*) from cq where id = '" + ID + "'")) === 1, "");
  ok("  상태가 `dropped` 다",
     psql("select state from cq where id = '" + ID + "'").trim() === "dropped", "");
  ok("  공개 보기에서는 **그 자리에서 빠진다**",
     Number(psql(anon + "select count(*) from v_cq_public where id = '" + ID + "'")) === 0, "");
  ok("  이미 내려간 글은 **다시 못 내린다**",
     !!denied(anon + "select drop_cq_guest('{\"id\":\"" + ID + "\",\"pw\":\"" + PW + "\"}'::jsonb)"), "");

  /* ── 쏟아붓기 세는 표를 아무도 못 읽는가 ──────────────────────── */
  ok("⚠️⚠️ 주소를 세는 표(`cqguest_hit`)를 **anon 이 못 읽는다**",
     !!denied(anon + "select count(*) from cqguest_hit"), "");
  ok("  로그인한 분도 **못 읽는다**",
     !!denied("select become('" + U + "'); set role authenticated; select count(*) from cqguest_hit"), "");
  /* ⚠️ 안쪽 도움함수를 밖에서 못 부르는가 (0050 에서 겪은 자리) */
  ok("  안쪽 도움함수(`cq_ip_hash`)를 **anon 이 못 부른다**",
     !!denied(anon + "select cq_ip_hash()"), "");
};
